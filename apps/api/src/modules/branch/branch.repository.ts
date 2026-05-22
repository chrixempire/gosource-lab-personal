import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { type Collection, type Db, type Document } from 'mongodb';
import type { CreateBranchDto, UpdateBranchDto } from './branch.dto';
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

type BusinessRecord = {
  id: string;
  name: string;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type BranchRecord = {
  id: string;
  businessId: string;
  branchName: string;
  branchCode: string;
  streetName: string;
  lga: string;
  state: string;
  isHeadquarter: boolean;
  isDeactivated: boolean;
  activatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class BranchRepository {
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

  private normalizeWhitespace(value: string) {
    return value.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  private toBranchRecord(doc: (BranchDocument & { _id: string }) | null): BranchRecord | null {
    if (!doc) {
      return null;
    }

    return {
      id: doc._id,
      businessId: doc.businessId,
      branchName: doc.branchName,
      branchCode: doc.branchCode,
      streetName: doc.streetName,
      lga: doc.lga,
      state: doc.state,
      isHeadquarter: doc.isHeadquarter,
      isDeactivated: doc.isDeactivated,
      activatedAt: doc.activatedAt ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  findBusinessById(businessId: string): Promise<BusinessRecord | null> {
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

  findBranchById(branchId: string): Promise<BranchRecord | null> {
    return this.collection<BranchDocument & { _id: string }>(BRANCH_COLLECTION)
      .findOne({ _id: branchId })
      .then((doc) => this.toBranchRecord(doc));
  }

  async findBranchByNameForBusiness(
    businessId: string,
    branchName: string,
    excludeBranchId?: string,
  ): Promise<BranchRecord | null> {
    const doc = await this.collection<BranchDocument & { _id: string }>(BRANCH_COLLECTION).findOne({
      businessId,
      branchName: { $regex: `^${this.escapeRegex(branchName)}$`, $options: 'i' },
      ...(excludeBranchId ? { _id: { $ne: excludeBranchId } } : {}),
    });

    return this.toBranchRecord(doc);
  }

  async findBranchByAddressForBusiness(
    businessId: string,
    streetName: string,
    lga: string,
    excludeBranchId?: string,
  ): Promise<BranchRecord | null> {
    const docs = await this.collection<BranchDocument & { _id: string }>(BRANCH_COLLECTION)
      .find({
        businessId,
        lga: { $regex: `^${this.escapeRegex(lga)}$`, $options: 'i' },
        ...(excludeBranchId ? { _id: { $ne: excludeBranchId } } : {}),
      })
      .toArray();

    const normalizedStreet = this.normalizeWhitespace(streetName);
    const match = docs.find((doc) => this.normalizeWhitespace(doc.streetName) === normalizedStreet);
    return this.toBranchRecord(match ?? null);
  }

  async countBranchesForBusiness(businessId: string, search?: string) {
    const trimmed = search?.trim();
    return this.collection<BranchDocument>(BRANCH_COLLECTION).countDocuments({
      businessId,
      ...(trimmed
        ? {
            $or: [
              { branchName: { $regex: this.escapeRegex(trimmed), $options: 'i' } },
              { branchCode: { $regex: this.escapeRegex(trimmed), $options: 'i' } },
              { streetName: { $regex: this.escapeRegex(trimmed), $options: 'i' } },
              { lga: { $regex: this.escapeRegex(trimmed), $options: 'i' } },
            ],
          }
        : {}),
    });
  }

  async findBranchesForBusiness(
    businessId: string,
    input: { page: number; limit: number; search?: string },
  ): Promise<BranchRecord[]> {
    const offset = (input.page - 1) * input.limit;
    const trimmed = input.search?.trim();

    const docs = await this.collection<BranchDocument & { _id: string }>(BRANCH_COLLECTION)
      .find({
        businessId,
        ...(trimmed
          ? {
              $or: [
                { branchName: { $regex: this.escapeRegex(trimmed), $options: 'i' } },
                { branchCode: { $regex: this.escapeRegex(trimmed), $options: 'i' } },
                { streetName: { $regex: this.escapeRegex(trimmed), $options: 'i' } },
                { lga: { $regex: this.escapeRegex(trimmed), $options: 'i' } },
              ],
            }
          : {}),
      })
      .sort({ createdAt: 1 })
      .skip(offset)
      .limit(input.limit)
      .toArray();

    return docs.map((doc) => this.toBranchRecord(doc)!).filter(Boolean);
  }

  async createBranch(input: {
    businessId: string;
    branchCode: string;
    isHeadquarter: boolean;
    branch: CreateBranchDto;
  }) {
    const now = new Date();
    const branchId = randomUUID();

    await this.collection<BranchDocument>(BRANCH_COLLECTION).insertOne({
      _id: branchId,
      businessId: input.businessId,
      branchName: input.branch.branchName,
      branchCode: input.branchCode,
      streetName: input.branch.streetName,
      lga: input.branch.lga,
      state: 'Lagos',
      isHeadquarter: input.isHeadquarter,
      isDeactivated: false,
      activatedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return this.findBranchById(branchId);
  }

  async updateBranch(branchId: string, input: UpdateBranchDto) {
    const now = new Date();
    await this.collection<BranchDocument>(BRANCH_COLLECTION).updateOne(
      { _id: branchId },
      {
        $set: {
          branchName: input.branchName,
          streetName: input.streetName,
          lga: input.lga,
          updatedAt: now,
        },
      },
    );

    return this.findBranchById(branchId);
  }

  async deactivateBranch(branchId: string) {
    const now = new Date();
    await this.collection<BranchDocument>(BRANCH_COLLECTION).updateOne(
      { _id: branchId },
      {
        $set: {
          isDeactivated: true,
          updatedAt: now,
        },
      },
    );

    return this.findBranchById(branchId);
  }

  async activateBranch(branchId: string) {
    const now = new Date();
    await this.collection<BranchDocument>(BRANCH_COLLECTION).updateOne(
      { _id: branchId },
      {
        $set: {
          isDeactivated: false,
          activatedAt: now,
          updatedAt: now,
        },
      },
    );

    return this.findBranchById(branchId);
  }

  async countEmployeeAccountsForBranch(branchId: string) {
    return this.collection<EmployeeDocument>(EMPLOYEE_COLLECTION).countDocuments({ branchId });
  }

  async countEmployeeInvitesForBranch(branchId: string) {
    return this.collection<EmployeeInviteDocument>(EMPLOYEE_INVITE_COLLECTION).countDocuments({
      branchId,
    });
  }

  async countMembersForBranch(branchId: string) {
    const [accounts, invites] = await Promise.all([
      this.countEmployeeAccountsForBranch(branchId),
      this.countEmployeeInvitesForBranch(branchId),
    ]);
    return accounts + invites;
  }

  async countMembersForBranchIds(branchIds: string[]) {
    const map = new Map<string, number>();
    if (branchIds.length === 0) {
      return map;
    }

    for (const id of branchIds) {
      map.set(id, 0);
    }

    const [accountRows, inviteRows] = await Promise.all([
      this.collection<EmployeeDocument>(EMPLOYEE_COLLECTION)
        .aggregate<{ _id: string; value: number }>([
          { $match: { branchId: { $in: branchIds } } },
          { $group: { _id: '$branchId', value: { $sum: 1 } } },
        ])
        .toArray(),
      this.collection<EmployeeInviteDocument>(EMPLOYEE_INVITE_COLLECTION)
        .aggregate<{ _id: string; value: number }>([
          { $match: { branchId: { $in: branchIds } } },
          { $group: { _id: '$branchId', value: { $sum: 1 } } },
        ])
        .toArray(),
    ]);

    for (const row of accountRows) {
      map.set(row._id, (map.get(row._id) ?? 0) + Number(row.value));
    }
    for (const row of inviteRows) {
      map.set(row._id, (map.get(row._id) ?? 0) + Number(row.value));
    }

    return map;
  }

  async deleteBranch(branchId: string) {
    await this.collection<BranchDocument>(BRANCH_COLLECTION).deleteOne({ _id: branchId });
  }
}
