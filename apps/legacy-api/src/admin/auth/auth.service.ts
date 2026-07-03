import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AdminUser, AdminUserDocument } from './schema/adminUser.schema';
import { Model } from 'mongoose';
import { AdminRole, AdminRoleDocument } from './schema/adminRole.schema';
import { AdminRoleInterface } from './interface/admin.interface';
import {
  AdminUserRole,
  AdminUserRoleDocument,
} from './schema/adminUserRole.schema';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../../notification/email/email.service';
import { NewEmailInterface } from '../../notification/email/email.interface';
import * as bcrypt from 'bcrypt';
import {
  CompletePasswordResetDto,
  InitiatePasswordResetDto,
  VerifyOTPDto,
} from './dto/set-password.dto';
import { generateOtp } from '../../utils/helpers';
import { adminInitiator } from '../../utils/activity-initiator.util';
import { ActivityService } from '../../activity/activity.service';
import {
  ACTIVITY_LOG_ACTION_TYPE,
  INITIATOR_TYPE,
} from '../../activity/interface/activityLog.interface';
import { OtpInterface } from '../../auth/interface/auth.interface';
import { AdminOtp, AdminOtpDocument } from './schema/otp.schema';
import { Role } from '../role/entities/role.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AdminAccountStatus } from './enum/admin.enum';
import { ResendInviteDto } from './dto/admin.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(AdminUser.name)
    private adminUserModel: Model<AdminUser>,

    @InjectModel(Role.name) private roleModel: Model<Role>,

    @InjectModel(AdminRole.name)
    private adminRoleModel: Model<AdminRole>,
    @InjectModel(AdminOtp.name)
    private otpModel: Model<AdminOtp>,
    @InjectModel(AdminUserRole.name)
    private adminUserRoleModel: Model<AdminUserRole>,
    private jwtService: JwtService,
    private emailService: EmailService,
    private activityService: ActivityService,
  ) {}

  /**
   * Create a new admin user.
   *
   * @param adminData
   * @returns
   */
  async createAdmin(adminData: CreateAdminDto): Promise<any> {
    const { callbackUrl, roleId, ...userDetails } = adminData;

    const findAdminUser: AdminUser = await this.adminUserModel.findOne({
      email: userDetails.email,
    });

    if (findAdminUser) throw new ConflictException('Admin already exists');

    const role = await this.roleModel.findById(roleId);
    if (!role) throw new NotFoundException('Role not found');
    if (!role.isActive) {
      throw new BadRequestException('Role is not active');
    }
    const newAdmin: AdminUserDocument = await this.adminUserModel.create({
      ...userDetails,
      roleId: role.id,
    });

    const payload = {
      id: newAdmin._id,
      role: role.name,
      email: newAdmin.email,
      firstName: newAdmin.firstName,
      lastName: newAdmin.lastName,
    };
    const access_token = await this.jwtService.signAsync(payload);
    const activationUrl = `${callbackUrl}?token=${access_token}`;

    this.sendInviteEmail({ user: newAdmin, activationUrl });

    return {
      message: 'Admin created successfully',
      data: {
        ...newAdmin.toObject(),
        role: role.name,
      },
      access_token,
    };
  }

  /**
   * Set admin password after creation.
   *
   * @param data
   * @param adminId
   * @returns
   */
  async setAdminPassword(data: any, adminId: string): Promise<any> {
    const adminUser: AdminUserDocument =
      await this.adminUserModel.findById(adminId);

    if (!adminUser) throw new NotFoundException('Admin User not found');

    const salt = await bcrypt.genSalt();
    adminUser.password = await bcrypt.hash(data.password, salt);
    adminUser.status = AdminAccountStatus.ACTIVE;
    adminUser.save();

    return {
      message: 'Password set successfully',
    };
  }

  /**
   * Admin login.
   *
   * @param data
   * @returns
   */
  private buildAdminTokenPayload(admin: {
    _id: unknown;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string | null;
    roleId?: { name?: string } | null;
  }) {
    return {
      id: admin._id,
      role: admin?.roleId?.name,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      phoneNumber: admin?.phoneNumber,
    };
  }

  private async issueAdminAuthTokens(admin: {
    _id: unknown;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string | null;
    roleId?: { name?: string } | null;
  }) {
    const payload = this.buildAdminTokenPayload(admin);

    const access_token = await this.jwtService.signAsync(
      { ...payload, tokenType: 'access' },
      // Honor JWT_EXPIRES_IN (e.g. "1d") so the access-token lifetime is
      // configurable; falls back to 15m when unset.
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' },
    );

    const refresh_token = await this.jwtService.signAsync(
      { ...payload, tokenType: 'refresh' },
      { expiresIn: '14d' },
    );

    return {
      message: 'Admin login successful',
      data: payload,
      access_token,
      refresh_token,
    };
  }

  async login(data: any, ipAddress?: string): Promise<any> {
    const admin: any = await this.adminUserModel
      .findOne({ email: data.email })
      .select('+password')
      .populate('roleId');

    if (!admin) {
      await this.logFailedLogin(data.email, ipAddress);
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!admin.password) {
      throw new BadRequestException('Admin has not setup password');
    }

    const hash = admin.password;
    const isMatch = await bcrypt.compare(data.password, hash);

    if (!isMatch) {
      await this.logFailedLogin(data.email, ipAddress);
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.activityService.record({
      initiator: String(admin._id),
      initiatorName: `${admin.firstName ?? ''} ${admin.lastName ?? ''}`.trim() || null,
      initiatorRole: admin.roleId?.name ?? null,
      initiatorType: INITIATOR_TYPE.ADMIN,
      action: ACTIVITY_LOG_ACTION_TYPE.LOGIN,
      module: 'Auth',
      ipAddress: ipAddress ?? null,
      description: 'Logged in',
    });

    return this.issueAdminAuthTokens(admin);
  }

  async logout(admin: any, ipAddress?: string): Promise<{ message: string }> {
    await this.activityService.record({
      ...adminInitiator(admin),
      action: ACTIVITY_LOG_ACTION_TYPE.LOGOUT,
      module: 'Auth',
      ipAddress: ipAddress ?? null,
      description: 'Logged out',
    });

    return { message: 'Signed out successfully' };
  }

  private async logFailedLogin(email: string, ipAddress?: string) {
    await this.activityService.record({
      initiator: null,
      initiatorName: email ?? null,
      initiatorType: INITIATOR_TYPE.ADMIN,
      action: ACTIVITY_LOG_ACTION_TYPE.LOGIN_FAILED,
      module: 'Auth',
      ipAddress: ipAddress ?? null,
      description: `Failed login attempt for ${email ?? 'unknown'}`,
    });
  }

  async refresh(data: { refreshToken: string }): Promise<any> {
    const incomingToken = data.refreshToken?.trim();

    if (!incomingToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    let decoded: Record<string, unknown>;

    try {
      decoded = await this.jwtService.verifyAsync(incomingToken, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (decoded.tokenType !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const adminId = decoded.id;

    if (!adminId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const admin: any = await this.adminUserModel
      .findById(adminId)
      .populate('roleId');

    if (!admin) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      ...(await this.issueAdminAuthTokens(admin)),
      message: 'Session refreshed successfully',
    };
  }

  /**
   * Create a new admin role.
   *
   * @param role
   * @returns
   */
  async createNewAdminRole(role: AdminRoleInterface) {
    const adminRole: AdminRoleDocument = await this.adminRoleModel.findOne({
      where: { name: role.name },
    });

    if (adminRole) {
      throw new ConflictException('Admin role already exist');
    }

    const newAdminRole: AdminRoleDocument =
      await this.adminRoleModel.create(role);

    if (newAdminRole) {
      return {
        message: 'Admin role created successfully',
        data: newAdminRole,
      };
    }
  }

  async initiatePasswordReset(data: InitiatePasswordResetDto): Promise<any> {
    const { email } = data;
    const user: AdminUserDocument = await this.adminUserModel.findOne({
      email,
    });
    if (user) {
      const oldOtp: AdminOtpDocument = await this.otpModel.findOne({ email });
      if (oldOtp) {
        await this.otpModel.findByIdAndDelete(oldOtp._id);
      }
      const code = generateOtp();
      const otpData: OtpInterface = {
        code,
        email,
      };

      await this.otpModel.create(otpData);
      const emailData: NewEmailInterface = {
        to: user.email,
        subject: 'Admin Reset Password',
        template: 'reset-admin-password',
        variables: { token: code, name: user.firstName },
      };

      this.emailService.sendMail(emailData);
    }
    return {
      message: 'Mail will be sent if User exists',
    };
  }

  async verifyOTP(data: VerifyOTPDto): Promise<any> {
    const { token, email } = data;

    const checkOtp: AdminOtpDocument = await this.otpModel.findOne({
      code: token,
      email,
    });

    if (!checkOtp) {
      throw new NotFoundException('Invalid OTP. Kindly try again');
    }

    const admin = await this.adminUserModel.findOne({ email });

    const adminRoles: AdminUserRoleDocument[] =
      await this.adminUserRoleModel.find({ adminId: admin.id });

    const roles = adminRoles.map(async (userRole) => {
      const role = await this.adminRoleModel.findById(userRole.roleId);
      return {
        id: userRole.id,
        role: role.name,
        status: userRole.status,
      };
    });

    // Wait for all role promises to resolve
    const resolvedRoles = await Promise.all(roles);

    const payload = {
      userId: admin.id,
      roles: resolvedRoles,
      email: admin.email,
    };

    const access_token = await this.jwtService.signAsync(payload);

    const { firstName, lastName } = admin;

    return {
      message: 'OTP Verification Successful',
      firstName,
      lastName,
      access_token,
    };
  }

  async completePasswordReset(data: CompletePasswordResetDto): Promise<any> {
    const { password, token, email } = data;

    const checkOtp: AdminOtp = await this.otpModel.findOne({
      code: token,
      email,
    });

    if (!checkOtp) {
      throw new NotFoundException('Invalid OTP. Kindly try again');
    }

    const user = await this.adminUserModel.findOne({ email });
    if (!user) throw new NotFoundException('User not found');

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    user.password = hashedPassword;
    await user.save();

    return {
      message: 'Password reset successful',
    };
  }

  async sendInviteEmail({ activationUrl, user }) {
    const { email, firstName } = user;
    const emailData: NewEmailInterface = {
      to: email,
      subject: 'Complete your account setup',
      template: 'new-admin',
      variables: {
        FIRSTNAME: firstName,
        ACTIVATION_URL: activationUrl,
      },
    };

    this.emailService.sendMail(emailData);
  }

  async resendActivateInvite(data: ResendInviteDto) {
    const { callbackUrl, userId } = data;
    const admin = await this.adminUserModel.findById(userId).populate('roleId');
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }
    if (admin.status !== AdminAccountStatus.INACTIVE) {
      throw new BadRequestException('Can only send invite to pending account');
    }

    const payload = {
      id: admin._id,
      role: (admin.roleId as any)?.name,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    const activationUrl = `${callbackUrl}?token=${accessToken}`;

    this.sendInviteEmail({ user: admin, activationUrl });
    return {
      message: 'Mail sent successfully',
    };
  }
}
