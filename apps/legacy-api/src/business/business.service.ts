import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  BusinessCustomer,
  BusinessCustomerDocument,
} from './schema/business.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { ChangePasswordInterface } from './interface/business.interface';
import { Otp, OtpDocument } from '../auth/schema/otp.schema';
import { generateOtp } from '../utils/helpers';
import {
  IPhoneNumber,
  OtpInterface,
  VerifyOtpInterface,
} from '../auth/interface/auth.interface';
import { EmailService } from '../notification/email/email.service';
import { NewEmailInterface } from '../notification/email/email.interface';
import { Employee } from '../employee/entities/employee.entity';
import { Branch, BranchDocument } from '../branch/entities/branch.entity';
import { assertPhoneNumberAvailable } from '../utils/phone.util';

@Injectable()
export class BusinessService {
  constructor(
    @InjectModel(BusinessCustomer.name)
    private businessModel: Model<BusinessCustomer>,
    @InjectModel(Otp.name) private otpModel: Model<Otp>,
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
    private emailService: EmailService,
    @InjectModel(Branch.name)
    private branchModel: Model<Branch>,
  ) {}

  /**
   * Fetch a business.
   *
   * @param businessId
   * @returns
   */
  async getBusiness(businessId: string): Promise<any> {
    const business: BusinessCustomerDocument =
      await this.businessModel.findById(businessId);

    let branchId = null;

    const branch: BranchDocument = await this.branchModel.findOne({
      businessId: business.id,
      isHeadquarter: true,
    });

    if (branch) {
      branchId = branch.id;
    }

    return {
      status: true,
      message: 'Business fetched successfully',
      data: { ...business.toObject(), branchId },
    };
  }
  async findByEmailOrThrowException(email: string): Promise<any> {
    const business: BusinessCustomerDocument = await this.businessModel.findOne(
      { email },
    );
    if (!business) {
      throw new HttpException(
        'You are not a business account',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return business;
  }

  /**
   * Change password.
   *
   * @param data
   * @param businessId
   * @returns
   */
  async changePassword(
    data: ChangePasswordInterface,
    businessId: string,
  ): Promise<any> {
    const business: BusinessCustomer = await this.businessModel
      .findById(businessId)
      .select('+password');

    const hash = business.password;
    const isMatch = await bcrypt.compare(data.oldPassword, hash);

    if (!isMatch) {
      throw new BadRequestException('Invalid old password');
    }

    if (data.oldPassword !== data.confirmPassword) {
      throw new BadRequestException('Password does not match');
    }

    const salt = await bcrypt.genSalt();
    const newPassword = await bcrypt.hash(data.newPassword, salt);
    const updateData = {
      password: newPassword,
    };

    const update = await this.businessModel.findByIdAndUpdate(
      businessId,
      updateData,
    );

    if (update) {
      return {
        messsage: 'Password changed successfully',
      };
    }
  }

  /**
   * Resend Otp.
   *
   * @param data
   */
  async sendOtp(data: any, businessDetails: any): Promise<any> {
    const { email } = data;

    const [employee, business] = await Promise.all([
      this.employeeModel.findById(businessDetails.id),
      this.businessModel.findById(businessDetails.id),
    ]);

    let initiator: string;
    let exist: any;

    if (employee) {
      initiator = 'employee';
      exist = await this.employeeModel.findOne({ email });
    } else {
      initiator = 'business';
      exist = await this.businessModel.findOne({ email });
    }

    if (exist) {
      throw new ConflictException('Email already exist');
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
        BUSINESS:
          initiator === 'employee' ? employee.firstName : business.businessName,
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
  async verifyOtp(
    data: VerifyOtpInterface,
    businessDetails: any,
  ): Promise<any> {
    const { otp, email } = data;
    const checkOtp: Otp = await this.otpModel.findOne({ code: otp, email });

    if (!checkOtp) {
      throw new NotFoundException('Invalid OTP. Kindly try again');
    }

    const [employee, business] = await Promise.all([
      this.employeeModel.findById(businessDetails.id),
      this.businessModel.findById(businessDetails.id),
    ]);

    if (employee) {
      await this.employeeModel.findByIdAndUpdate(employee.id, {
        email: data.email,
      });
    } else {
      await this.businessModel.findByIdAndUpdate(business.id, {
        email: data.email,
      });
    }

    await this.otpModel.deleteOne({ code: otp, email });

    return {
      message: 'OTP verified successfully',
    };
  }

  /**
   * Verify OTP.
   *
   * @param data
   * @returns {object}
   */
  async changePhoneNumber(
    data: IPhoneNumber,
    businessDetails: any,
  ): Promise<any> {
    const { newPhoneNumber, firstName, lastName } = data;
    const phoneNumber = newPhoneNumber;

    const [employee, business] = await Promise.all([
      this.employeeModel.findById(businessDetails.id),
      this.businessModel.findById(businessDetails.id),
    ]);

    if (employee) {
      await assertPhoneNumberAvailable(phoneNumber, {
        employeeModel: this.employeeModel,
        businessModel: this.businessModel,
      }, { employeeId: employee.id });

      await this.employeeModel.findByIdAndUpdate(employee.id, {
        phoneNumber,
        firstName,
        lastName,
      });
    } else {
      await assertPhoneNumberAvailable(phoneNumber, {
        employeeModel: this.employeeModel,
        businessModel: this.businessModel,
      }, { businessId: business.id });

      await this.businessModel.findByIdAndUpdate(business.id, {
        phoneNumber,
        firstName,
        lastName,
      });
    }

    return {
      message: 'Phone number changed successfully',
      data: !employee ? business : employee,
    };
  }

  // Generate a function to delete account
  async deleteAccount(businessId: string): Promise<any> {
    const business: BusinessCustomerDocument =
      await this.businessModel.findById(businessId);

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    await this.businessModel.findByIdAndDelete(businessId);

    return {
      message: 'Business account deleted successfully',
    };
  }
}
