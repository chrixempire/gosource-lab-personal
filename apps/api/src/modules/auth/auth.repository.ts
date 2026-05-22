import {
  ObjectId,
  type Collection,
  type Db,
  type Document,
  type OptionalUnlessRequiredId,
} from 'mongodb';
import { Injectable } from '@nestjs/common';
import type { CustomerResetPasswordDto, CustomerSetupAccountDto } from './auth.dto';
import { MongoService } from '../../infrastructure/mongo/mongo.service';
import {
  BUSINESS_CUSTOMER_COLLECTION,
  type BusinessCustomerDocument,
} from '../../infrastructure/mongo/schemas/business-customer.schema';
import {
  EMPLOYEE_COLLECTION,
  type EmployeeDocument,
} from '../../infrastructure/mongo/schemas/employee.schema';
import {
  CUSTOMER_SESSION_COLLECTION,
  EMPLOYEE_SESSION_COLLECTION,
  type CustomerSessionDocument,
  type EmployeeSessionDocument,
} from '../../infrastructure/mongo/schemas/session.schema';
import {
  OTP_COLLECTION,
  type OtpDocument,
} from '../../infrastructure/mongo/schemas/otp.schema';

type CustomerAccountRecord = {
  id: string;
  businessId: string;
  email: string;
  status: string;
  onboardingStep: number;
  otpCode: string | null;
  otpExpiresAt: Date | null;
  verifiedAt: Date | null;
  passwordHash: string | null;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
};

type EmployeeAccountRecord = {
  id: string;
  businessId: string;
  branchId: string;
  email: string;
  role: string;
  position: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  status: string;
  passwordHash: string | null;
  otpCode: string | null;
  otpExpiresAt: Date | null;
};

@Injectable()
export class AuthRepository {
  constructor(private readonly mongoService: MongoService) {}

  private get mongoDb(): Db {
    const db = this.mongoService.db;
    if (!db) {
      throw new Error('MongoDB connection is unavailable');
    }
    return db;
  }

  private collection<T extends Document>(name: string): Collection<T> {
    return this.mongoDb.collection<T>(name);
  }

  private toStringId(value: string | null | undefined) {
    if (!value) {
      return '';
    }

    return value;
  }

  private async findOtpByEmail(email: string) {
    return await this.collection<OtpDocument>(OTP_COLLECTION).findOne({
      email,
    });
  }

  private mapMongoCustomer(
    doc: (BusinessCustomerDocument & { _id: string }) | null,
    otp: (OtpDocument & { _id: string }) | null,
  ): CustomerAccountRecord | null {
    if (!doc) {
      return null;
    }

    return {
      id: this.toStringId(doc._id),
      businessId: doc.businessId || this.toStringId(doc._id),
      email: doc.email,
      status: doc.status,
      onboardingStep: doc.onboardingStep,
      otpCode: otp?.codeHash ?? null,
      otpExpiresAt: otp?.expiresAt ?? null,
      verifiedAt: doc.verifiedAt ?? null,
      passwordHash: doc.passwordHash ?? null,
      firstName: doc.firstName || null,
      lastName: doc.lastName || null,
      phoneNumber: doc.phoneNumbers?.[0] ?? null,
    };
  }

  private mapMongoEmployee(
    doc: (EmployeeDocument & { _id: string }) | null,
    otp: (OtpDocument & { _id: string }) | null,
  ): EmployeeAccountRecord | null {
    if (!doc) {
      return null;
    }

    return {
      id: this.toStringId(doc._id),
      businessId: doc.businessId,
      branchId: doc.branchId,
      email: doc.email,
      role: doc.role,
      position: doc.position,
      firstName: doc.firstName,
      lastName: doc.lastName,
      phoneNumber: doc.phoneNumber,
      status: doc.status,
      passwordHash: doc.passwordHash ?? null,
      otpCode: otp?.codeHash ?? null,
      otpExpiresAt: otp?.expiresAt ?? null,
    };
  }

  private mapMongoCustomerSession(doc: (CustomerSessionDocument & { _id: string }) | null) {
    if (!doc) {
      return null;
    }

    return {
      id: doc._id,
      customerAccountId: doc.customerAccountId,
      refreshTokenHash: doc.refreshTokenHash,
      expiresAt: doc.expiresAt,
      revokedAt: doc.revokedAt ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      lastUsedAt: doc.updatedAt,
    };
  }

  private mapMongoEmployeeSession(doc: (EmployeeSessionDocument & { _id: string }) | null) {
    if (!doc) {
      return null;
    }

    return {
      id: doc._id,
      employeeAccountId: doc.employeeAccountId,
      refreshTokenHash: doc.refreshTokenHash,
      expiresAt: doc.expiresAt,
      revokedAt: doc.revokedAt ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      lastUsedAt: doc.updatedAt,
    };
  }

  async findCustomerByEmail(email: string) {
    const [doc, otp] = await Promise.all([
      this.collection<BusinessCustomerDocument & { _id: string }>(
        BUSINESS_CUSTOMER_COLLECTION,
      ).findOne({
        email,
      }),
      this.findOtpByEmail(email),
    ]);

    return this.mapMongoCustomer(doc, otp as (OtpDocument & { _id: string }) | null);
  }

  async findCustomerById(id: string) {
    const doc = await this.collection<BusinessCustomerDocument & { _id: string }>(
      BUSINESS_CUSTOMER_COLLECTION,
    ).findOne({
      _id: id,
    });

    return this.mapMongoCustomer(doc, null);
  }

  async findBusinessByName(name: string) {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const doc = await this.collection<BusinessCustomerDocument & { _id: string }>(
      BUSINESS_CUSTOMER_COLLECTION,
    ).findOne({
      businessName: {
        $regex: `^${escapedName}$`,
        $options: 'i',
      },
    });

    if (!doc) {
      return null;
    }

    return {
      id: this.toStringId(doc._id),
      name: doc.businessName,
      email: doc.email,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async findCustomerByNormalizedPhone(phoneNumber: string) {
    const normalizedPhone = phoneNumber.replace(/\D/g, '');
    const doc = await this.collection<BusinessCustomerDocument & { _id: string }>(
      BUSINESS_CUSTOMER_COLLECTION,
    ).findOne({
      normalizedPhoneNumbers: normalizedPhone,
    });

    return this.mapMongoCustomer(doc, null);
  }

  async createPendingSignup(input: { businessName: string; email: string; otpCodeHash: string }) {
    const now = new Date();
    const otpExpiresAt = new Date(now.getTime() + 10 * 60 * 1000);
    const id = new ObjectId();

    const doc: OptionalUnlessRequiredId<BusinessCustomerDocument> = {
      _id: id.toHexString(),
      businessId: id.toHexString(),
      businessName: input.businessName,
      firstName: '',
      lastName: '',
      phoneNumbers: [],
      normalizedPhoneNumbers: [],
      email: input.email,
      type: 'BUSINESS',
      passwordHash: null,
      verified: false,
      verifiedAt: null,
      isDeactivated: false,
      role: 'super_admin',
      status: 'pending_verification',
      onboardingStep: 2,
      createdAt: now,
      updatedAt: now,
    };

    await this.collection<BusinessCustomerDocument>(BUSINESS_CUSTOMER_COLLECTION).insertOne(doc);
    await this.collection<OtpDocument>(OTP_COLLECTION).updateOne(
      { email: input.email },
      {
        $set: {
          email: input.email,
          codeHash: input.otpCodeHash,
          purpose: 'customer_signup',
          expiresAt: otpExpiresAt,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true },
    );

    return {
      accountId: id.toHexString(),
      businessId: id.toHexString(),
      otpExpiresAt,
    };
  }

  async updateOtpForCustomer(email: string, otpCodeHash: string) {
    const now = new Date();
    const otpExpiresAt = new Date(now.getTime() + 10 * 60 * 1000);

    await this.collection<OtpDocument>(OTP_COLLECTION).updateOne(
      { email },
      {
        $set: {
          email,
          codeHash: otpCodeHash,
          purpose: 'customer_signup',
          expiresAt: otpExpiresAt,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true },
    );

    return otpExpiresAt;
  }

  async markCustomerVerified(email: string) {
    const now = new Date();

    await this.collection<BusinessCustomerDocument>(BUSINESS_CUSTOMER_COLLECTION).updateOne(
      { email },
      {
        $set: {
          verified: true,
          verifiedAt: now,
          status: 'pending_setup',
          onboardingStep: 3,
          updatedAt: now,
        },
      },
    );

    await this.collection<OtpDocument>(OTP_COLLECTION).deleteOne({ email });
  }

  async setPasswordResetOtp(email: string, otpCodeHash: string) {
    const now = new Date();
    const otpExpiresAt = new Date(now.getTime() + 10 * 60 * 1000);

    await this.collection<OtpDocument>(OTP_COLLECTION).updateOne(
      { email },
      {
        $set: {
          email,
          codeHash: otpCodeHash,
          purpose: 'customer_password_reset',
          expiresAt: otpExpiresAt,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true },
    );

    return otpExpiresAt;
  }

  async clearPasswordResetOtp(email: string) {
    await this.collection<OtpDocument>(OTP_COLLECTION).deleteOne({ email });
  }

  async updatePassword(email: string, _payload: CustomerResetPasswordDto, passwordHash: string) {
    const now = new Date();

    await this.collection<BusinessCustomerDocument>(BUSINESS_CUSTOMER_COLLECTION).updateOne(
      { email },
      {
        $set: {
          passwordHash,
          updatedAt: now,
        },
      },
    );

    await this.collection<OtpDocument>(OTP_COLLECTION).deleteOne({ email });
  }

  async completeSetup(email: string, payload: CustomerSetupAccountDto, passwordHash: string) {
    const now = new Date();
    const normalizedPhone = payload.phoneNumber.replace(/\D/g, '');

    await this.collection<BusinessCustomerDocument>(BUSINESS_CUSTOMER_COLLECTION).updateOne(
      { email },
      {
        $set: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          phoneNumbers: [payload.phoneNumber],
          normalizedPhoneNumbers: [normalizedPhone],
          passwordHash,
          status: 'active',
          onboardingStep: 4,
          verified: true,
          verifiedAt: now,
          updatedAt: now,
        },
      },
    );

    return await this.findCustomerByEmail(email);
  }

  async createCustomerSession(input: {
    sessionId: string;
    customerAccountId: string;
    refreshTokenHash: string;
    expiresAt: Date;
  }) {
    const now = new Date();

    await this.collection<CustomerSessionDocument>(CUSTOMER_SESSION_COLLECTION).insertOne({
      _id: input.sessionId,
      customerAccountId: input.customerAccountId,
      refreshTokenHash: input.refreshTokenHash,
      expiresAt: input.expiresAt,
      revokedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  async findCustomerSessionById(sessionId: string) {
    const doc = await this.collection<CustomerSessionDocument & { _id: string }>(
      CUSTOMER_SESSION_COLLECTION,
    ).findOne({
      _id: sessionId,
    });

    return this.mapMongoCustomerSession(doc);
  }

  async rotateCustomerSession(input: {
    sessionId: string;
    refreshTokenHash: string;
    expiresAt: Date;
  }) {
    const now = new Date();

    await this.collection<CustomerSessionDocument>(CUSTOMER_SESSION_COLLECTION).updateOne(
      { _id: input.sessionId },
      {
        $set: {
          refreshTokenHash: input.refreshTokenHash,
          expiresAt: input.expiresAt,
          revokedAt: null,
          updatedAt: now,
        },
      },
    );
  }

  async revokeCustomerSession(sessionId: string) {
    const now = new Date();
    await this.collection<CustomerSessionDocument>(CUSTOMER_SESSION_COLLECTION).updateOne(
      { _id: sessionId },
      {
        $set: {
          revokedAt: now,
          updatedAt: now,
        },
      },
    );
  }

  async findEmployeeByEmail(email: string) {
    const [doc, otp] = await Promise.all([
      this.collection<EmployeeDocument & { _id: string }>(EMPLOYEE_COLLECTION).findOne({
        email,
      }),
      this.findOtpByEmail(email),
    ]);

    return this.mapMongoEmployee(doc, otp as (OtpDocument & { _id: string }) | null);
  }

  async findEmployeeById(id: string) {
    const doc = await this.collection<EmployeeDocument & { _id: string }>(
      EMPLOYEE_COLLECTION,
    ).findOne({
      _id: id,
    });

    return this.mapMongoEmployee(doc, null);
  }

  async setEmployeePasswordResetOtp(email: string, otpCodeHash: string) {
    const now = new Date();
    const otpExpiresAt = new Date(now.getTime() + 10 * 60 * 1000);

    await this.collection<OtpDocument>(OTP_COLLECTION).updateOne(
      { email },
      {
        $set: {
          email,
          codeHash: otpCodeHash,
          purpose: 'employee_password_reset',
          expiresAt: otpExpiresAt,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true },
    );

    return otpExpiresAt;
  }

  async clearEmployeePasswordResetOtp(email: string) {
    await this.collection<OtpDocument>(OTP_COLLECTION).deleteOne({ email });
  }

  async updateEmployeePasswordByEmail(email: string, passwordHash: string) {
    const now = new Date();

    await this.collection<EmployeeDocument>(EMPLOYEE_COLLECTION).updateOne(
      { email },
      {
        $set: {
          passwordHash,
          updatedAt: now,
        },
      },
    );

    await this.collection<OtpDocument>(OTP_COLLECTION).deleteOne({ email });
  }

  async createEmployeeSession(input: {
    sessionId: string;
    employeeAccountId: string;
    refreshTokenHash: string;
    expiresAt: Date;
  }) {
    const now = new Date();

    await this.collection<EmployeeSessionDocument>(EMPLOYEE_SESSION_COLLECTION).insertOne({
      _id: input.sessionId,
      employeeAccountId: input.employeeAccountId,
      refreshTokenHash: input.refreshTokenHash,
      expiresAt: input.expiresAt,
      revokedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  async findEmployeeSessionById(sessionId: string) {
    const doc = await this.collection<EmployeeSessionDocument & { _id: string }>(
      EMPLOYEE_SESSION_COLLECTION,
    ).findOne({
      _id: sessionId,
    });

    return this.mapMongoEmployeeSession(doc);
  }

  async rotateEmployeeSession(input: {
    sessionId: string;
    refreshTokenHash: string;
    expiresAt: Date;
  }) {
    const now = new Date();

    await this.collection<EmployeeSessionDocument>(EMPLOYEE_SESSION_COLLECTION).updateOne(
      { _id: input.sessionId },
      {
        $set: {
          refreshTokenHash: input.refreshTokenHash,
          expiresAt: input.expiresAt,
          revokedAt: null,
          updatedAt: now,
        },
      },
    );
  }

  async revokeEmployeeSession(sessionId: string) {
    const now = new Date();

    await this.collection<EmployeeSessionDocument>(EMPLOYEE_SESSION_COLLECTION).updateOne(
      { _id: sessionId },
      {
        $set: {
          revokedAt: now,
          updatedAt: now,
        },
      },
    );
  }
}
