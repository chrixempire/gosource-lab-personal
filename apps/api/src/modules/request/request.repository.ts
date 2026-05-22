import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { type Collection, type Db, type Document } from 'mongodb';
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
  REQUEST_COLLECTION,
  type RequestActorDocument,
  type RequestDocument,
  type RequestPaymentStatus,
  type RequestStatus,
} from '../../infrastructure/mongo/schemas/request.schema';
import type { SessionPrincipal } from '../auth/session-auth.guard';

type CreateRequestRecordInput = Omit<
  RequestDocument,
  '_id' | 'reference' | 'createdAt' | 'updatedAt'
>;

@Injectable()
export class RequestRepository {
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

  async findCustomerById(accountId: string) {
    return this.collection<BusinessCustomerDocument & { _id: string }>(
      BUSINESS_CUSTOMER_COLLECTION,
    ).findOne({ _id: accountId });
  }

  async findEmployeeById(employeeId: string) {
    return this.collection<EmployeeDocument & { _id: string }>(EMPLOYEE_COLLECTION).findOne({
      _id: employeeId,
    });
  }

  async findBranchById(branchId: string) {
    return this.collection<BranchDocument & { _id: string }>(BRANCH_COLLECTION).findOne({
      _id: branchId,
    });
  }

  async createRequest(input: CreateRequestRecordInput) {
    const now = new Date();
    const requestId = randomUUID();
    const reference = `REQ-${Math.floor(100000 + Math.random() * 900000)}`;

    await this.collection<RequestDocument>(REQUEST_COLLECTION).insertOne({
      _id: requestId,
      reference,
      ...input,
      createdAt: now,
      updatedAt: now,
    });

    return this.findRequestById(requestId);
  }

  async findRequestById(requestId: string) {
    return this.collection<RequestDocument & { _id: string }>(REQUEST_COLLECTION).findOne({
      _id: requestId,
    });
  }

  async countRequestsForPrincipal(
    principal: SessionPrincipal,
    query: { search?: string; status?: RequestStatus; branchId?: string },
  ) {
    const docs = await this.findRequestsForPrincipal(principal, query);
    return docs.length;
  }

  async findRequestsForPrincipal(
    principal: SessionPrincipal,
    query: { search?: string; status?: RequestStatus; branchId?: string },
  ) {
    const docs = await this.collection<RequestDocument & { _id: string }>(REQUEST_COLLECTION)
      .find({
        businessId: principal.businessId,
        ...(principal.user_type === 'employee'
          ? { branchId: principal.branchId, 'initiator.accountId': principal.employeeId }
          : {}),
        ...(principal.user_type === 'customer' && query.branchId ? { branchId: query.branchId } : {}),
        ...(query.status ? { status: query.status } : {}),
      })
      .sort({ createdAt: -1 })
      .toArray();

    const search = query.search?.trim().toLowerCase();
    if (!search) {
      return docs;
    }

    return docs.filter((doc) => {
      const terms = [
        doc.reference,
        doc.status,
        doc.branchName,
        doc.paymentStatus,
        doc.initiator.email,
        doc.initiator.firstName ?? '',
        doc.initiator.lastName ?? '',
        doc.products.map((product) => product.productName).join(' '),
      ];
      return terms.some((term) => term.toLowerCase().includes(search));
    });
  }

  async updateRequestStatus(
    requestId: string,
    input: {
      status?: RequestStatus;
      paymentStatus?: RequestPaymentStatus;
      paymentMethod?: string | null;
      approver?: RequestActorDocument | null;
      rejectedBy?: RequestActorDocument | null;
      rejectedReasons?: string | null;
      approvedAt?: Date | null;
      rejectedAt?: Date | null;
      cancelledAt?: Date | null;
    },
  ) {
    await this.collection<RequestDocument>(REQUEST_COLLECTION).updateOne(
      { _id: requestId },
      {
        $set: {
          ...input,
          updatedAt: new Date(),
        },
      },
    );

    return this.findRequestById(requestId);
  }
}
