import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Otp, OtpDocument } from './schema/otp.schema';
import { Model } from 'mongoose';
import {
  BusinessCustomer,
  BusinessCustomerDocument,
} from '../business/schema/business.schema';
import { JwtService } from '@nestjs/jwt';
import {
  BusinessLogin,
  BusinessRegisterInterface,
  INewPassword,
  IResetPassword,
  NewAccountSetupInterface,
  OtpInterface,
  VerifyOtpInterface,
} from './interface/auth.interface';
import * as bcrypt from 'bcrypt';
import { generateOtp } from '../utils/helpers';
import { EmailService } from '../notification/email/email.service';
import { NewEmailInterface } from '../notification/email/email.interface';
import { Employee } from '../employee/entities/employee.entity';
import { Branch, BranchDocument } from '../branch/entities/branch.entity';
import { SlackService } from '../slack/slack.service';
import { NewBusinessDto } from './dto/auth.dto';
import { AccountType } from '../business/enum/business.enum';
import { assertPhoneNumberAvailable } from '../utils/phone.util';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Otp.name) private otpModel: Model<Otp>,
    @InjectModel(BusinessCustomer.name)
    private businessModel: Model<BusinessCustomer>,
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
    private jwtService: JwtService,
    private emailService: EmailService,
    private readonly slackService: SlackService,
    @InjectModel(Branch.name)
    private branchModel: Model<Branch>,
  ) {}

  /**
   * Register
   *
   * @param data
   * @returns
   */
  async register(data: NewBusinessDto): Promise<any> {
    const {
      email,
      businessName,
      password,
      accountType,
      firstName,
      lastName,
      phoneNumber,
    } = data;

    const [business, employee] = await Promise.all([
      this.businessModel.findOne({ email }),
      this.employeeModel.findOne({ email }),
    ]);

    if (employee) {
      throw new ConflictException({
        statusCode: 409,
        message: 'Email already exists with an account, try to log in',
        onboardingStep: employee.onboardingStep,
      });
    }

    if (business) {
      const sameBusinessName =
        business.businessName?.trim().toLowerCase() ===
        businessName?.trim().toLowerCase();
      const setupComplete = Boolean(business.firstName && business.lastName);

      if (setupComplete) {
        throw new ConflictException({
          statusCode: 409,
          message: 'Email already exists with an account, try to log in',
          onboardingStep: business.onboardingStep,
        });
      }

      if (!sameBusinessName) {
        throw new ConflictException({
          statusCode: 409,
          message:
            'This email is already registered with a different business name. Sign in or use a different email.',
        });
      }

      if (!business.verified) {
        await this.resendOtp({ email });
      }

      return {
        message: business.verified
          ? 'Continue setting up your account'
          : 'Verification code sent. Continue your registration',
        data: {
          ...business.toObject(),
          resume: true,
        },
      };
    }

    if (businessName) {
      const businessNameCheck: BusinessCustomerDocument =
        await this.businessModel.findOne({
          businessName,
        });

      if (businessNameCheck) {
        throw new ConflictException('Business name already exists');
      }
    }

    // Set password if account type is individual
    if (accountType && accountType === AccountType.INDIVIDUAL) {
      const salt = await bcrypt.genSalt();
      data.password = await bcrypt.hash(password, salt);
      data['role'] = 'Super Admin';
    }

    const businessData: BusinessRegisterInterface = {
      ...data,
      ...(accountType === AccountType.INDIVIDUAL
        ? { businessName: firstName }
        : { businessName }),
      onboardingStep: 1,
    };

    const newbusiness = await this.businessModel.create(businessData);

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
        BUSINESS: newbusiness.businessName,
      },
    };

    this.emailService.sendMail(emailData);

    if (newbusiness) {
      if (accountType && accountType === AccountType.INDIVIDUAL) {
        // Add customer to email list
        this.emailService.addSubscriber(email, firstName, lastName);

        const emailData: NewEmailInterface = {
          to: email,
          subject: 'Welcome to Gosource App',
          template: 'welcome',
          variables: {
            BUSINESS: newbusiness.businessName,
          },
        };

        this.emailService.sendMail(emailData);

        if (process.env.NODE_ENV !== 'development') {
          const adminEmails = [
            'lanrebello@ipc-africa.com',
            'nana@ipc-africa.com',
            'mena@ipc-africa.com',
            'newaccounts@ipc-africa.com',
            'vnneji@ipc-africa.com',
            'hanifah@ipc-africa.com',
            'halimaadun@ipc-africa.com',
            'quadrii@ipc-africa.com',
            'jennifer@ipc-africa.com',
          ];

          const subject =
            process.env.NODE_ENV === 'development'
              ? 'New Client Signup [Test]'
              : 'New Client Signup';

          for (let i = 0; i < adminEmails.length; i++) {
            const adminEmailData: NewEmailInterface = {
              to: adminEmails[i],
              subject,
              template: 'new-sign',
              variables: {
                BUSINESS: newbusiness.businessName,
                FIRSTNAME: firstName,
                LASTNAME: lastName,
                EMAIL: email,
                PHONE: phoneNumber,
              },
            };

            this.emailService.sendMail(adminEmailData);
          }

          this.slackService.sendNewUserNotification(newbusiness);
        }
      }
      return {
        message: 'Registration successful',
        data: newbusiness,
      };
    }
  }

  /**
   * Resend Otp.
   *
   * @param data
   */
  async resendOtp(data: any): Promise<any> {
    const { email } = data;
    const business: BusinessCustomerDocument = await this.businessModel.findOne(
      { email },
    );

    if (!business) {
      throw new NotFoundException('No business found with this email');
    }

    if (business.verified) {
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
        BUSINESS: business.businessName,
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
      throw new NotFoundException('Invalid OTP. Kindly try again');
    }

    const business: BusinessCustomerDocument = await this.businessModel.findOne(
      { email },
    );

    if (!business) {
      throw new BadRequestException('No business found with this email');
    }

    // Update business status
    const updateBusiness = await this.businessModel.findOneAndUpdate(
      { email },
      { verified: true, onboardingStep: 2 },
    );

    if (updateBusiness) {
      // Delete otp after confirmation
      await this.otpModel.deleteOne({ code: otp, email });
    }

    return {
      message: 'OTP verified successfully',
    };
  }

  /**
   * Set up account.
   *
   * @param data
   * @returns
   */
  async setupAccount(data: NewAccountSetupInterface): Promise<any> {
    const { email } = data;
    const business: BusinessCustomerDocument = await this.businessModel.findOne(
      {
        email,
      },
    );

    if (!business) {
      throw new NotFoundException('No business found with this email');
    }

    if (business.firstName && business.lastName) {
      throw new BadRequestException('Account already set up. Kindly login');
    }

    if (!business.verified) {
      throw new BadRequestException('Please verify your email to proceed');
    }

    await assertPhoneNumberAvailable(data.phoneNumber, {
      employeeModel: this.employeeModel,
      businessModel: this.businessModel,
    }, { businessId: business._id.toString() });

    const salt = await bcrypt.genSalt();
    data.password = await bcrypt.hash(data.password, salt);
    data.role = 'Super Admin';
    data.onboardingStep = 3;

    const update = await this.businessModel.findByIdAndUpdate(
      business._id,
      {
        ...data,
      },
      { new: true },
    );

    if (update) {
      if (process.env.NODE_ENV !== 'development') {
        // Add customer to email list
        this.emailService.addSubscriber(
          email,
          update.firstName,
          update.lastName,
        );
      }

      const emailData: NewEmailInterface = {
        to: email,
        subject: 'Welcome to Gosource App',
        template: 'welcome',
        variables: {
          BUSINESS: business.businessName,
        },
      };

      this.emailService.sendMail(emailData);

      const payload = {
        sub: update.id,
        email: update.email,
        id: update.id,
        user_type: 'BUSINESS',
        role: 'Super Admin',
      };

      const access_token = await this.jwtService.signAsync(payload);

      if (process.env.NODE_ENV !== 'development') {
        const adminEmails = [
          'lanrebello@ipc-africa.com',
          'nana@ipc-africa.com',
          'mena@ipc-africa.com',
          'newaccounts@ipc-africa.com',
          'vnneji@ipc-africa.com',
          'hanifah@ipc-africa.com',
          'halimaadun@ipc-africa.com',
          'quadrii@ipc-africa.com',
          'jennifer@ipc-africa.com',
        ];

        const subject =
          process.env.NODE_ENV === 'development'
            ? 'New Client Signup [Test]'
            : 'New Client Signup';

        for (let i = 0; i < adminEmails.length; i++) {
          const adminEmailData: NewEmailInterface = {
            to: adminEmails[i],
            subject,
            template: 'new-sign',
            variables: {
              BUSINESS: business.businessName,
              FIRSTNAME: update.firstName,
              LASTNAME: update.lastName,
              EMAIL: update.email,
              PHONE: update.phoneNumber,
            },
          };

          this.emailService.sendMail(adminEmailData);
        }

        this.slackService.sendNewUserNotification(update);
      }

      return {
        message: 'Account setup successfull',
        data: update,
        token: access_token,
      };
    }
  }

  /**
   * Login
   *
   * @param data
   * @returns
   */
  async login(data: BusinessLogin): Promise<any> {
    const { email, password } = data;

    const [employee, business] = await Promise.all([
      this.employeeModel
        .findOne({ email })
        .select('+password')
        .populate('businessId'),
      this.businessModel.findOne({ email }).select('+password'),
    ]);

    if (!employee && !business) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Invalid email or password',
        onboardingStep: business?.onboardingStep ?? employee?.onboardingStep,
      });
    }

    if (employee) {
      if (!employee.password) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'Employee setup incomplete',
          onboardingStep: employee?.onboardingStep,
        });
      }

      const hash = employee.password;
      const isMatch = await bcrypt.compare(password, hash);

      if (!isMatch) {
        throw new BadRequestException('Invalid email or password');
      }

      const payload = {
        sub: employee.id,
        email: employee.email,
        id: employee.id,
        user_type: 'EMPLOYEE',
        role: employee.role,
        businessId: (employee.businessId as any)?._id,
        business: employee.businessId,
        branchId: employee.branchId,
        firstName: employee.firstName,
        lastName: employee.lastName,
      };

      const access_token = await this.jwtService.signAsync(payload);

      employee.password = undefined;

      return {
        message: 'Login successful',
        data: {
          access_token,
        },
        user: employee,
      };
    }

    if (!business || !business.password) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Invalid email or password',
        onboardingStep: business?.onboardingStep ?? employee?.onboardingStep,
      });
    }

    const hash = business.password;
    const isMatch = await bcrypt.compare(password, hash);

    if (!isMatch) {
      throw new BadRequestException('Invalid email or password');
    }

    // For v1 customers
    if (!business.role) {
      await this.businessModel.findByIdAndUpdate(
        business.id,
        { role: 'Super Admin' },
        { new: true },
      );
    }

    let branchId = null;

    const branch: BranchDocument = await this.branchModel.findOne({
      businessId: business.id,
      isHeadquarter: true,
    });

    if (branch) {
      branchId = branch.id;
    }

    const payload = {
      sub: business.id,
      email: business.email,
      id: business.id,
      user_type: 'BUSINESS',
      role: !business.role ? 'Super Admin' : business.role,
      branchId,
    };

    const access_token = await this.jwtService.signAsync(payload);

    business.password = undefined;

    return {
      message: 'Login successful',
      data: {
        access_token,
      },
      user: {
        ...business.toObject(),
        branchId,
        role: !business.role ? 'Super Admin' : business.role,
      },
    };
  }

  /**
   * Send password reset email.
   *
   * @param passwordDetails
   * @returns {object}
   */
  async sendPasswordResetMail(passwordDetails: IResetPassword): Promise<any> {
    const { email } = passwordDetails;

    const [employee, business] = await Promise.all([
      this.employeeModel.findOne({ email }),
      this.businessModel.findOne({ email }).select('+password'),
    ]);

    if (!business && !employee) {
      throw new NotFoundException('No account found with the email');
    }

    let initiator: string;

    if (employee) {
      if (!employee.password) {
        throw new BadRequestException('Kindly complete your account setup');
      }

      initiator = employee.firstName;
    } else {
      if (!business.password) {
        throw new BadRequestException('Account setup incomplete');
      }

      initiator = business.firstName;
    }

    const code = generateOtp();
    const otpData: OtpInterface = {
      code,
      email,
    };

    await this.otpModel.create(otpData);

    const emailData: NewEmailInterface = {
      to: email,
      subject: 'Reset your password',
      template: 'reset-password-otp',
      variables: {
        OTP: code,
        BUSINESS: initiator,
      },
    };

    const mailResult = await this.emailService.sendMail(emailData);
    if (mailResult && typeof mailResult === 'object' && 'failed' in mailResult && mailResult.failed) {
      throw new ServiceUnavailableException(
        'Unable to send password reset email. Try again later or contact support.',
      );
    }

    return {
      status: true,
      message: 'OTP sent successfully',
      data: { email },
    };
  }

  /**
   * Verify OTP.
   *
   * @param data
   * @returns {object}
   */
  async verifyPasswordOtp(data: VerifyOtpInterface): Promise<any> {
    const { otp, email } = data;
    const checkOtp: Otp = await this.otpModel.findOne({ code: otp, email });

    if (!checkOtp) {
      throw new NotFoundException('Invalid OTP. Kindly try again');
    }

    await this.otpModel.deleteOne({ code: otp, email });

    return {
      message: 'OTP verified successfully',
    };
  }

  /**
   * Reset password.
   *
   * @param data
   * @returns {object}
   */
  async resetPassword(data: INewPassword): Promise<any> {
    const { email, newPassword } = data;

    const [employee, business] = await Promise.all([
      this.employeeModel.findOne({ email }),
      this.businessModel.findOne({ email }),
    ]);

    if (!business && !employee) {
      throw new NotFoundException('No account found with the email');
    }

    const salt = await bcrypt.genSalt();
    const password = await bcrypt.hash(newPassword, salt);

    if (employee) {
      await this.employeeModel.findByIdAndUpdate(
        employee.id,
        { password },
        { new: true },
      );
    } else {
      await this.businessModel.findByIdAndUpdate(
        business.id,
        { password },
        { new: true },
      );
    }

    return {
      status: true,
      message: 'Password reset successfully',
    };
  }

  async sendContactEmail(data: any): Promise<any> {
    const { firstName, lastName, email, phone, reasons, businessName } = data;
    const emailData: NewEmailInterface = {
      to: 'support@gosource.app',
      subject: 'Account deletion request',
      template: 'delete-account',
      variables: {
        FIRSTNAME: firstName,
        LASTNAME: lastName,
        BUSINESS_NAME: businessName,
        PHONE: phone,
        EMAIL: email,
        REASONS: reasons,
      },
    };

    this.emailService.sendMail(emailData);

    return {
      message: 'Email sent successfully',
    };
  }
}
