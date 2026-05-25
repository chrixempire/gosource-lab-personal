import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateEmployeeDto,
  InviteEmployeeDto,
} from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/edit-employee.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Employee, EmployeeDocument } from './entities/employee.entity';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { EmailService } from 'src/notification/email/email.service';
import { generateOtp } from 'src/utils/helpers';
import {
  OtpInterface,
  VerifyOtpInterface,
} from 'src/auth/interface/auth.interface';
import { Otp, OtpDocument } from 'src/auth/schema/otp.schema';
import { NewEmailInterface } from 'src/notification/email/email.interface';
import { LoginEmployeeDto } from './dto/login-employee.dto';
import { JwtService } from '@nestjs/jwt';
import {
  EmployeeInvite,
  EmployeeInviteDocument,
} from './entities/invites.entity';
import {
  BusinessCustomer,
  BusinessCustomerDocument,
} from '../business/schema/business.schema';
import { Branch, BranchDocument } from '../branch/entities/branch.entity';
import { validateInviteCallbackUrl } from './invite-callback-url.util';
import { assertPhoneNumberAvailable } from '../utils/phone.util';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
    @InjectModel(EmployeeInvite.name)
    private employeeInviteModel: Model<EmployeeInvite>,
    private emailService: EmailService,
    private jwtService: JwtService,
    @InjectModel(BusinessCustomer.name)
    private businessModel: Model<BusinessCustomer>,
    @InjectModel(Otp.name) private otpModel: Model<Otp>,
    @InjectModel(Branch.name)
    private branchModel: Model<Branch>,
  ) {}

  private async getAuthBusinessId(authId: string) {
    const [employee, business] = await Promise.all([
      this.employeeModel.findById(authId).lean(),
      this.businessModel.findById(authId).lean(),
    ]);

    if (!employee && !business) {
      throw new NotFoundException('No employee or business found');
    }

    return employee?.businessId?.toString() || business._id.toString();
  }

  /**
   * Send employee invitation.
   *
   * @param inviteEmployeeDto
   * @param business
   * @returns {object}
   */
  async inviteEmployee(
    inviteEmployeeDto: InviteEmployeeDto,
    business: any,
  ): Promise<any> {
    const { email, branchId } = inviteEmployeeDto;
    const callbackUrl = validateInviteCallbackUrl(inviteEmployeeDto.callbackUrl);
    const checkInvite: EmployeeInviteDocument = await this.employeeInviteModel
      .findOne({
        email,
        branchId,
        businessId: business.id,
      })
      .populate('businessId');

    if (checkInvite) {
      const activationUrl = await this.generateInviteActivationUrl(
        checkInvite.id,
        callbackUrl,
      );

      const emailData: NewEmailInterface = {
        to: checkInvite.email,
        subject: `You have been invited to join ${checkInvite.businessId.businessName}`,
        template: 'new-employee',
        variables: {
          ACTIVATION_URL: activationUrl,
          BUSINESS: checkInvite.businessId.businessName,
        },
      };

      this.emailService.sendMail(emailData);

      return {
        message: 'Employee invitation sent successfully',
        data: this.buildInviteResponse(checkInvite, activationUrl),
      };
    }

    const [employee, invite] = await Promise.all([
      this.employeeModel.findOne({
        email,
      }),
      this.employeeInviteModel.findOne({
        email,
      }),
    ]);

    if (invite) {
      throw new ConflictException('Invitation with this email already exist.');
    }

    if (employee) {
      throw new ConflictException(
        'Email already exists with an account, try to log in',
      );
    }

    const businessCheck: BusinessCustomer = await this.businessModel.findOne({
      email,
    });

    if (businessCheck) {
      throw new ConflictException(
        'A business account already exists with this email, try to log in',
      );
    }

    const inviteDetails = {
      ...inviteEmployeeDto,
      callbackUrl,
      businessId: business.id,
    };

    const newIvite: EmployeeInviteDocument =
      await this.employeeInviteModel.create(inviteDetails);

    const activationUrl = await this.generateInviteActivationUrl(
      newIvite.id,
      callbackUrl,
    );

    const businessDetails: BusinessCustomerDocument =
      await this.businessModel.findById(business.id);

    const emailData: NewEmailInterface = {
      to: newIvite.email,
      subject: `You have been invited to join ${businessDetails.businessName}`,
      template: 'new-employee',
      variables: {
        ACTIVATION_URL: activationUrl,
        BUSINESS: businessDetails.businessName,
      },
    };

    this.emailService.sendMail(emailData);

    if (newIvite) {
      return {
        message: 'Employee invitation sent successfully',
        data: this.buildInviteResponse(newIvite, activationUrl),
      };
    }
  }

  /**
   * Get invitation details.
   *
   * @param invitationId
   * @returns
   */
  async getInvitationDetails(invitationId: string): Promise<any> {
    const invite: EmployeeInviteDocument =
      await this.employeeInviteModel
        .findById(invitationId)
        .populate('businessId')
        .populate('branchId');

    if (!invite) {
      throw new NotFoundException('Invitation not found');
    }

    return {
      status: true,
      message: 'Invitation fetched successfully',
      data: {
        invitationId: invite.id,
        email: invite.email,
        role: invite.role,
        branchId:
          typeof (invite.branchId as any)?._id?.toString === 'function'
            ? (invite.branchId as any)._id.toString()
            : invite.branchId?.toString?.() || '',
        branchName: (invite.branchId as any)?.branchName || null,
        businessName: (invite.businessId as any)?.businessName || null,
      },
    };
  }

  async resendInvite(inviteId: string, business: any, data: any): Promise<any> {
    const invitation = await this.employeeInviteModel.findOne({
      _id: inviteId,
      businessId: business.id,
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const nextEmail = data?.email?.trim?.() || invitation.email;
    const nextRole = data?.role || invitation.role;
    const callbackUrl = validateInviteCallbackUrl(data?.callbackUrl);

    if (nextEmail !== invitation.email) {
      const [employee, businessAccount, conflictingInvite] = await Promise.all([
        this.employeeModel.findOne({ email: nextEmail }),
        this.businessModel.findOne({ email: nextEmail }),
        this.employeeInviteModel.findOne({
          email: nextEmail,
          branchId: invitation.branchId,
          businessId: business.id,
          _id: { $ne: inviteId },
        }),
      ]);

      if (employee || businessAccount || conflictingInvite) {
        throw new ConflictException(
          'Email already exists with an account or invitation',
        );
      }
    }

    invitation.email = nextEmail;
    invitation.role = nextRole;
    await invitation.save();

    const activationUrl = await this.generateInviteActivationUrl(
      invitation.id,
      callbackUrl,
    );

    const businessDetails: BusinessCustomerDocument =
      await this.businessModel.findById(business.id);

    const emailData: NewEmailInterface = {
      to: invitation.email,
      subject: `You have been invited to join ${businessDetails.businessName}`,
      template: 'new-employee',
      variables: {
        ACTIVATION_URL: activationUrl,
        BUSINESS: businessDetails.businessName,
      },
    };

    this.emailService.sendMail(emailData);

    return {
      message: 'Employee invitation sent successfully',
      data: this.buildInviteResponse(invitation, activationUrl),
    };
  }

  async generateInviteLink(
    inviteId: string,
    business: any,
    callbackUrl: string,
  ): Promise<any> {
    const invitation = await this.employeeInviteModel.findOne({
      _id: inviteId,
      businessId: business.id,
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const normalizedCallbackUrl = validateInviteCallbackUrl(callbackUrl);

    const activationUrl = await this.generateInviteActivationUrl(
      invitation.id,
      normalizedCallbackUrl,
    );

    return {
      message: 'Invitation link generated successfully',
      data: this.buildInviteResponse(invitation, activationUrl),
    };
  }

  async hashPassword(password: string) {
    const salt = await bcrypt.genSalt();
    return await bcrypt.hash(password, salt);
  }

  /**
   * Complete new employee setup.
   *
   * @param createEmployeeDto
   * @returns {object}
   */
  async setupAccount(
    createEmployeeDto: CreateEmployeeDto,
    inviteId: string,
  ): Promise<any> {
    const employeeInvite = await this.employeeInviteModel.findById(inviteId);

    if (!employeeInvite) {
      throw new NotFoundException('Invitation not found');
    }

    const employee: EmployeeDocument = await this.employeeModel.findOne({
      email: employeeInvite.email,
    });

    if (employee) {
      throw new BadRequestException('Account already set up. Kindly login');
    }

    await assertPhoneNumberAvailable(createEmployeeDto.phoneNumber, {
      employeeModel: this.employeeModel,
      businessModel: this.businessModel,
    });

    createEmployeeDto.password = await this.hashPassword(
      createEmployeeDto.password,
    );

    const newEmployee: EmployeeDocument = await this.employeeModel.create({
      ...createEmployeeDto,
      businessId: employeeInvite.businessId,
      email: employeeInvite.email,
      branchId: employeeInvite.branchId,
      role: employeeInvite.role,
      verified: true,
    });

    await this.employeeInviteModel.findByIdAndDelete(inviteId);

    const access_token = await this.generateToken(newEmployee);

    if (newEmployee) {
      return this.buildResponse({ access_token }, 'Setup successful');
    }
  }

  async login(data: LoginEmployeeDto): Promise<any> {
    const { email, password } = data;
    const employee: EmployeeDocument = await this.employeeModel
      .findOne({
        email,
      })
      .select('+password');

    if (!employee || !employee.password) {
      throw new BadRequestException('Invalid email or password');
    }

    const hash = employee.password;
    const isMatch = await bcrypt.compare(password, hash);

    if (!isMatch) {
      throw new BadRequestException('Invalid email or password');
    }
    const access_token = await this.generateToken(employee);
    return this.buildResponse(access_token, 'Login sucessfully');
  }

  async generateToken(employee: EmployeeDocument) {
    const payload = {
      sub: employee.id,
      email: employee.email,
      id: employee.id,
      user_type: 'EMPLOYEE',
      role: employee.role,
      businessId: employee.businessId,
      branchId: employee.branchId,
      firstName: employee.firstName,
      lastName: employee.lastName,
    };
    const access_token = await this.jwtService.signAsync(payload);
    return access_token;
  }

  /**
   * Get all business employees.
   * @param businessId
   * @returns {object}
   */
  async getBusinessEmployees(businessDetails: any): Promise<any> {
    const [employee, business] = await Promise.all([
      this.employeeModel.findById(businessDetails.id),
      this.businessModel.findById(businessDetails.id),
    ]);

    let initiator: string;

    if (employee) {
      initiator = 'employee';
    } else {
      initiator = 'business';
    }

    let employees;
    if (initiator === 'employee') {
      employees = await this.employeeModel
        .find({ branchId: employee.branchId })
        .populate('branchId')
        .exec();
    } else {
      employees = await this.employeeModel
        .find({ businessId: business.id })
        .populate('branchId')
        .exec();
    }
    return this.buildResponse(employees, 'Employees retrieved successfully');
  }

  /**
   * Get branch employees.
   *
   * @param businessId
   * @param branchId
   * @returns {object}
   */
  async getBranchEmployees(branchId: string, authId: string): Promise<any> {
    const businessId = await this.getAuthBusinessId(authId);
    const branch = await this.branchModel.findOne({ _id: branchId, businessId });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const employees = await this.employeeModel
      .find({ branchId, businessId })
      .populate('branchId')
      .exec();
    return this.buildResponse(employees, 'Employees retrieved successfully');
  }

  /**
   * Get single employee.
   *
   * @param employeeId
   * @returns
   */
  async getSingleEmployee(employeeId: string, authId: string) {
    const businessId = await this.getAuthBusinessId(authId);
    const employee = await this.employeeModel
      .findOne({ _id: employeeId, businessId })
      .populate('branchId')
      .exec();

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return this.buildResponse(employee, 'Employee retrieved successfully');
  }

  async update(
    id: string,
    updateEmployeeDto: UpdateEmployeeDto,
    authId: string,
  ) {
    const businessId = await this.getAuthBusinessId(authId);

    if (updateEmployeeDto.branchId) {
      const branch = await this.branchModel.findOne({
        _id: updateEmployeeDto.branchId,
        businessId,
      });
      if (!branch) {
        throw new NotFoundException('Branch not found');
      }
    }

    delete updateEmployeeDto.role;

    if (updateEmployeeDto.phoneNumber) {
      await assertPhoneNumberAvailable(updateEmployeeDto.phoneNumber, {
        employeeModel: this.employeeModel,
        businessModel: this.businessModel,
      }, { employeeId: id });
    }

    const update = await this.employeeModel.findOneAndUpdate(
      { _id: id, businessId },
      updateEmployeeDto,
      { new: true },
    );

    if (update) {
      return this.buildResponse(update, 'Employee updated successfully');
    }
  }

  /**
   * Deactivate employee.
   *
   * @param employeeId
   * @returns {object}
   */
  async deactivateEmployee(employeeId: string, authId: string): Promise<any> {
    const businessId = await this.getAuthBusinessId(authId);
    const employee: EmployeeDocument = await this.employeeModel.findOne({
      _id: employeeId,
      businessId,
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const update = await this.employeeModel.findOneAndUpdate(
      { _id: employeeId, businessId },
      {
        isDeactivated: true,
      },
    );

    if (update) {
      return this.buildResponse(update, 'Employee deactivated successfully');
    }
  }

  /**
   * Activate employee.
   *
   * @param employeeId
   * @returns {object}
   */
  async activateEmployee(employeeId: string, authId: string): Promise<any> {
    const businessId = await this.getAuthBusinessId(authId);
    const employee: EmployeeDocument = await this.employeeModel.findOne({
      _id: employeeId,
      businessId,
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const update = await this.employeeModel.findOneAndUpdate(
      { _id: employeeId, businessId },
      {
        isDeactivated: false,
      },
    );

    if (update) {
      return this.buildResponse(update, 'Employee activated successfully');
    }
  }

  async deleteEmployee(employeeId: string, authId: string): Promise<any> {
    const businessId = await this.getAuthBusinessId(authId);
    const employee: EmployeeDocument = await this.employeeModel.findOne({
      _id: employeeId,
      businessId,
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    await this.employeeModel.deleteOne({ _id: employeeId, businessId });

    return this.buildResponse({ id: employeeId }, 'Employee deleted successfully');
  }

  async resendOtp(data: any): Promise<any> {
    const { email } = data;
    const employee: EmployeeDocument = await this.employeeModel.findOne({
      email,
    });

    if (!employee) {
      throw new NotFoundException('No employee found with this email');
    }

    if (employee.verified) {
      throw new BadRequestException('Email already verified');
    }

    const oldOtp: OtpDocument = await this.otpModel.findOne({ email });
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
      to: email,
      subject: 'Email verification',
      template: 'otp',
      variables: {
        OTP: code,
        // BUSINESS: ,
      },
    };

    this.emailService.sendMail(emailData);

    return {
      message: 'OTP sent successfully',
    };
  }

  /**
   * Verify OTP.
   *
   * @param data
   * @returns {object}
   */
  async verifyOtp(data: VerifyOtpInterface): Promise<any> {
    const { otp, email } = data;
    const checkOtp: Otp = await this.otpModel.findOne({ code: otp, email });

    if (!checkOtp) {
      throw new BadRequestException('Invalid OTP. Kindly try again');
    }

    const employee: EmployeeDocument = await this.employeeModel.findOne({
      email,
    });

    if (!employee) {
      throw new BadRequestException('No employee found with this email');
    }

    const updateEmployee = await this.employeeModel.findOneAndUpdate(
      { email },
      { verified: true },
    );

    if (updateEmployee) {
      // Delete otp after confirmation
      await this.otpModel.deleteOne({ code: otp, email });
    }

    return {
      message: 'OTP verified successfully',
      status: true,
    };
  }

  /**
   * Get pending invites by business id.
   *
   * @param businessId
   * @returns {object}
   */
  async getPendingInviteByBusinessId(businessId: string): Promise<any> {
    const invites = await this.employeeInviteModel.find({ businessId });

    return this.buildResponse(invites, 'Invites retrieved successfully');
  }

  /**
   * Get pending invites by branch id.
   *
   * @param branchId
   * @returns {object}
   */
  async getPendingInviteByBranchId(
    branchId: string,
    authId: string,
  ): Promise<any> {
    const businessId = await this.getAuthBusinessId(authId);
    const branch: BranchDocument = await this.branchModel.findOne({
      _id: branchId,
      businessId,
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const invites = await this.employeeInviteModel
      .find({ branchId })
      .populate('branchId')
      .exec();

    return this.buildResponse(invites, 'Invites retrieved successfully');
  }

  /**
   * Delete employee pending invite.
   *
   * @param inviteId
   * @param business
   * @returns {object}
   */
  async deletePendingInvite(inviteId: string, business: any): Promise<any> {
    const invitation = await this.employeeInviteModel.findOne({
      _id: inviteId,
      businessId: business.id,
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    await this.employeeInviteModel.deleteOne({
      _id: inviteId,
      businessId: business.id,
    });

    return this.buildResponse(
      { invitationId: inviteId },
      'Invitation cancelled successfully',
    );
  }

  async changeRole(
    employeeId: string,
    roleDetails: any,
    businessId: string,
  ): Promise<any> {
    const employee: EmployeeDocument = await this.employeeModel.findOne({
      _id: employeeId,
      businessId,
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const updateRole = await this.employeeModel.findByIdAndUpdate(
      employeeId,
      { role: roleDetails.role },
      { new: true },
    );

    if (updateRole) {
      return this.buildResponse(updateRole, 'Role updated successfully');
    }
  }

  async changeBranch(
    employeeId: string,
    branchId: string,
    businessId: string,
  ): Promise<any> {
    const [employee, branch] = await Promise.all([
      this.employeeModel.findOne({
        _id: employeeId,
        businessId,
      }),
      this.branchModel.findOne({ _id: branchId, businessId }),
    ]);

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const updatedData = await this.employeeModel
      .findByIdAndUpdate(employeeId, { branchId }, { new: true })
      .populate('branchId');

    return this.buildResponse(updatedData, 'Branch updated successfully');
  }

  buildResponse(data: any, message: string = 'successfully') {
    return {
      status: true,
      message,
      data,
    };
  }

  private async generateInviteActivationUrl(
    invitationId: string,
    callbackUrl: string,
  ) {
    const payload = {
      invitationId,
    };

    const access_token = await this.jwtService.signAsync(payload);

    return `${callbackUrl}?token=${access_token}&invitationId=${invitationId}`;
  }

  private buildInviteResponse(invite: EmployeeInviteDocument, activationUrl: string) {
    return {
      invitationId: invite.id,
      email: invite.email,
      role: invite.role,
      branchId:
        typeof invite.branchId?.toString === 'function'
          ? invite.branchId.toString()
          : String(invite.branchId ?? ''),
      activationUrl,
    };
  }
}
