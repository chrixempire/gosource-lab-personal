import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { type Collection, type Db, type Document } from 'mongodb';
import type { InviteEmployeeDto } from './employee.dto';
import { MongoService } from '../../infrastructure/mongo/mongo.service';
import {
  BUSINESS_CUSTOMER_COLLECTION,
  type BusinessCustomerDocument,
} from '../../infrastructure/mongo/schemas/business-customer.schema';
import {
  BRANCH_COLLECTION,
  type BranchDocument,
} from '../../infrastructure/mongo/schemas/branch.schema';
import {
  EMPLOYEE_COLLECTION,
  type EmployeeDocument,
} from '../../infrastructure/mongo/schemas/employee.schema';
import {
  EMPLOYEE_INVITE_COLLECTION,
  type EmployeeInviteDocument,
} from '../../infrastructure/mongo/schemas/employee-invite.schema';

type EmployeeAccountDetailRecord = {
  id: string;
  businessId: string;
  branchId: string;
  email: string;
  role: string;
  position: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  normalizedPhoneNumber: string;
  status: string;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type BranchMemberAccountRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  position: string;
  role: string;
  status: string;
  createdAt: Date;
};

type BranchMemberInviteRow = {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
};

@Injectable()
export class EmployeeRepository {
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

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private mapEmployeeAccount(
    doc: (EmployeeDocument & { _id: string }) | null,
  ): EmployeeAccountDetailRecord | null {
    if (!doc) {
      return null;
    }

    return {
      id: doc._id,
      businessId: doc.businessId,
      branchId: doc.branchId,
      email: doc.email,
      role: doc.role,
      position: doc.position,
      firstName: doc.firstName,
      lastName: doc.lastName,
      phoneNumber: doc.phoneNumber,
      normalizedPhoneNumber: doc.normalizedPhoneNumber,
      status: doc.status,
      verifiedAt: doc.verifiedAt ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  findCustomerByBusinessId(businessId: string) {
    return this.collection<BusinessCustomerDocument & { _id: string }>(
      BUSINESS_CUSTOMER_COLLECTION,
    )
      .findOne({ businessId })
      .then((doc) => (doc ? { id: doc._id } : null));
  }

  findBranchById(branchId: string) {
    return this.collection<BranchDocument & { _id: string }>(BRANCH_COLLECTION)
      .findOne({ _id: branchId })
      .then((doc) =>
        doc
          ? {
              id: doc._id,
              businessId: doc.businessId,
              branchName: doc.branchName,
            }
          : null,
      );
  }

  findInviteByBusinessBranchEmail(businessId: string, branchId: string, email: string) {
    return this.collection<EmployeeInviteDocument & { _id: string }>(EMPLOYEE_INVITE_COLLECTION)
      .findOne({
        businessId,
        branchId,
        email: { $regex: `^${this.escapeRegex(email)}$`, $options: 'i' },
      })
      .then((doc) =>
        doc
          ? {
              id: doc._id,
              businessId: doc.businessId,
              branchId: doc.branchId,
              email: doc.email,
              role: doc.role,
              callbackUrl: doc.callbackUrl,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
            }
          : null,
      );
  }

  findInviteByEmail(email: string) {
    return this.collection<EmployeeInviteDocument & { _id: string }>(EMPLOYEE_INVITE_COLLECTION)
      .findOne({
        email: { $regex: `^${this.escapeRegex(email)}$`, $options: 'i' },
      })
      .then((doc) => (doc ? { id: doc._id } : null));
  }

  findInviteById(invitationId: string) {
    return this.collection<EmployeeInviteDocument & { _id: string }>(EMPLOYEE_INVITE_COLLECTION)
      .findOne({ _id: invitationId })
      .then((doc) =>
        doc
          ? {
              id: doc._id,
              businessId: doc.businessId,
              branchId: doc.branchId,
              email: doc.email,
              role: doc.role,
              callbackUrl: doc.callbackUrl,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
            }
          : null,
      );
  }

  findCustomerByEmail(email: string) {
    return this.collection<BusinessCustomerDocument & { _id: string }>(
      BUSINESS_CUSTOMER_COLLECTION,
    )
      .findOne({
        email: { $regex: `^${this.escapeRegex(email)}$`, $options: 'i' },
      })
      .then((doc) => (doc ? { id: doc._id } : null));
  }

  findCustomerByNormalizedPhone(normalizedPhoneNumber: string) {
    return this.collection<BusinessCustomerDocument & { _id: string }>(
      BUSINESS_CUSTOMER_COLLECTION,
    )
      .findOne({
        normalizedPhoneNumbers: normalizedPhoneNumber,
      })
      .then((doc) => (doc ? { id: doc._id } : null));
  }

  findEmployeeByEmail(email: string) {
    return this.collection<EmployeeDocument & { _id: string }>(EMPLOYEE_COLLECTION)
      .findOne({
        email: { $regex: `^${this.escapeRegex(email)}$`, $options: 'i' },
      })
      .then((doc) => (doc ? { id: doc._id } : null));
  }

  findEmployeeByNormalizedPhone(normalizedPhoneNumber: string) {
    return this.collection<EmployeeDocument & { _id: string }>(EMPLOYEE_COLLECTION)
      .findOne({ normalizedPhoneNumber })
      .then((doc) => (doc ? { id: doc._id } : null));
  }

  findEmployeeAccountById(id: string) {
    return this.collection<EmployeeDocument & { _id: string }>(EMPLOYEE_COLLECTION)
      .findOne({ _id: id })
      .then((doc) => this.mapEmployeeAccount(doc));
  }

  async updateEmployeeAccountPartial(
    id: string,
    patch: Partial<{
      firstName: string;
      lastName: string;
      phoneNumber: string;
      normalizedPhoneNumber: string;
      role: string;
      position: string;
      branchId: string;
      status: string;
    }>,
  ) {
    const now = new Date();
    const nextStatus = patch.status as EmployeeDocument['status'] | undefined;
    const nextRole = patch.role as EmployeeDocument['role'] | undefined;
    const mongoPatch: Partial<EmployeeDocument> = {
      updatedAt: now,
    };

    if (patch.firstName !== undefined) mongoPatch.firstName = patch.firstName;
    if (patch.lastName !== undefined) mongoPatch.lastName = patch.lastName;
    if (patch.phoneNumber !== undefined) mongoPatch.phoneNumber = patch.phoneNumber;
    if (patch.normalizedPhoneNumber !== undefined) {
      mongoPatch.normalizedPhoneNumber = patch.normalizedPhoneNumber;
    }
    if (nextRole !== undefined) mongoPatch.role = nextRole;
    if (patch.position !== undefined) mongoPatch.position = patch.position;
    if (patch.branchId !== undefined) mongoPatch.branchId = patch.branchId;
    if (nextStatus !== undefined) {
      mongoPatch.status = nextStatus;
      mongoPatch.isDeactivated = nextStatus === 'inactive';
    }

    await this.collection<EmployeeDocument>(EMPLOYEE_COLLECTION).updateOne(
      { _id: id },
      {
        $set: mongoPatch,
      },
    );
  }

  findBusinessById(businessId: string) {
    return this.collection<BusinessCustomerDocument & { _id: string }>(
      BUSINESS_CUSTOMER_COLLECTION,
    )
      .findOne({ businessId })
      .then((doc) =>
        doc
          ? {
              id: doc.businessId || doc._id,
              name: doc.businessName,
              email: doc.email,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
            }
          : null,
      );
  }

  async createInvite(input: InviteEmployeeDto & { businessId: string }) {
    const now = new Date();
    const invitationId = randomUUID();

    await this.collection<EmployeeInviteDocument>(EMPLOYEE_INVITE_COLLECTION).insertOne({
      _id: invitationId,
      businessId: input.businessId,
      branchId: input.branchId,
      email: input.email,
      role: input.role,
      status: 'pending',
      callbackUrl: input.callbackUrl,
      createdAt: now,
      updatedAt: now,
    });

    return this.findInviteById(invitationId);
  }

  async createEmployeeAccount(input: {
    businessId: string;
    branchId: string;
    email: string;
    role: string;
    position: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    normalizedPhoneNumber: string;
    passwordHash: string;
  }) {
    const now = new Date();
    const employeeId = randomUUID();

    await this.collection<EmployeeDocument>(EMPLOYEE_COLLECTION).insertOne({
      _id: employeeId,
      businessId: input.businessId,
      branchId: input.branchId,
      email: input.email,
      role: input.role as EmployeeDocument['role'],
      position: input.position,
      firstName: input.firstName,
      lastName: input.lastName,
      phoneNumber: input.phoneNumber,
      normalizedPhoneNumber: input.normalizedPhoneNumber,
      passwordHash: input.passwordHash,
      status: 'active',
      isDeactivated: false,
      verifiedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return this.findEmployeeAccountById(employeeId);
  }

  async updateInvitePartial(invitationId: string, patch: { email?: string; role?: string }) {
    if (Object.keys(patch).length === 0) {
      return;
    }

    const now = new Date();
    const mongoPatch: Partial<EmployeeInviteDocument> = {
      updatedAt: now,
    };

    if (patch.email !== undefined) {
      mongoPatch.email = patch.email;
    }
    if (patch.role !== undefined) {
      mongoPatch.role = patch.role as EmployeeInviteDocument['role'];
    }

    await this.collection<EmployeeInviteDocument>(EMPLOYEE_INVITE_COLLECTION).updateOne(
      { _id: invitationId },
      {
        $set: mongoPatch,
      },
    );
  }

  deleteInvite(invitationId: string) {
    return this.collection<EmployeeInviteDocument>(EMPLOYEE_INVITE_COLLECTION).deleteOne({
      _id: invitationId,
    });
  }

  async touchInviteUpdatedAt(invitationId: string) {
    const now = new Date();
    await this.collection<EmployeeInviteDocument>(EMPLOYEE_INVITE_COLLECTION).updateOne(
      { _id: invitationId },
      {
        $set: {
          updatedAt: now,
        },
      },
    );
  }

  async countAccountsAndInvitesForBranch(branchId: string) {
    const [accounts, invites] = await Promise.all([
      this.collection<EmployeeDocument>(EMPLOYEE_COLLECTION).countDocuments({ branchId }),
      this.collection<EmployeeInviteDocument>(EMPLOYEE_INVITE_COLLECTION).countDocuments({
        branchId,
      }),
    ]);

    return accounts + invites;
  }

  async findEmployeeAccountsForBranch(branchId: string): Promise<BranchMemberAccountRow[]> {
    const docs = await this.collection<EmployeeDocument & { _id: string }>(EMPLOYEE_COLLECTION)
      .find({ branchId })
      .sort({ createdAt: 1 })
      .toArray();

    return docs.map((doc) => ({
      id: doc._id,
      email: doc.email,
      firstName: doc.firstName,
      lastName: doc.lastName,
      position: doc.position,
      role: doc.role,
      status: doc.status,
      createdAt: doc.createdAt,
    }));
  }

  async findEmployeeInvitesForBranch(branchId: string): Promise<BranchMemberInviteRow[]> {
    const docs = await this.collection<EmployeeInviteDocument & { _id: string }>(
      EMPLOYEE_INVITE_COLLECTION,
    )
      .find({ branchId })
      .sort({ createdAt: 1 })
      .toArray();

    return docs.map((doc) => ({
      id: doc._id,
      email: doc.email,
      role: doc.role,
      createdAt: doc.createdAt,
    }));
  }

  deleteEmployeeAccount(employeeId: string) {
    return this.collection<EmployeeDocument>(EMPLOYEE_COLLECTION).deleteOne({
      _id: employeeId,
    });
  }
}
