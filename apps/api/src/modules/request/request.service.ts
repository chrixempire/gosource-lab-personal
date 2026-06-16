import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { SessionPrincipal } from '../auth/session-auth.guard';
import type {
  RequestActorDocument,
  RequestDocument,
} from '../../infrastructure/mongo/schemas/request.schema';
import {
  CreateRequestDto,
  ListRequestsQueryDto,
  RejectRequestDto,
  UpdateRequestPaymentDto,
  requestStatuses,
} from './request.dto';
import type { RequestStatus } from '../../infrastructure/mongo/schemas/request.schema';
import { RequestRepository } from './request.repository';

function parseRequestStatusFilter(raw?: string): {
  status?: RequestStatus;
  statuses?: RequestStatus[];
} {
  const value = raw?.trim();
  if (!value) {
    return {};
  }

  const parts = value
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry): entry is RequestStatus =>
      (requestStatuses as readonly string[]).includes(entry),
    );

  if (parts.length === 0) {
    return {};
  }

  if (parts.length === 1) {
    return { status: parts[0] };
  }

  return { statuses: parts };
}

@Injectable()
export class RequestService {
  constructor(private readonly repository: RequestRepository) {}

  private async buildActor(principal: SessionPrincipal): Promise<RequestActorDocument> {
    if (principal.user_type === 'customer') {
      const customer = await this.repository.findCustomerById(principal.accountId);
      if (!customer) {
        throw new NotFoundException('Business account not found');
      }

      return {
        accountId: customer._id,
        user_type: 'customer',
        email: customer.email,
        firstName: customer.firstName || null,
        lastName: customer.lastName || null,
        phoneNumber: customer.phoneNumbers?.[0] ?? null,
        role: customer.role,
        branchId: null,
      };
    }

    const employee = await this.repository.findEmployeeById(principal.employeeId);
    if (!employee) {
      throw new NotFoundException('Employee account not found');
    }

    return {
      accountId: employee._id,
      user_type: 'employee',
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      phoneNumber: employee.phoneNumber,
      role: employee.role,
      branchId: employee.branchId,
    };
  }

  private mapRequest(doc: (RequestDocument & { _id: string }) | null) {
    if (!doc) {
      return null;
    }

    return {
      id: doc._id,
      businessId: doc.businessId,
      branchId: doc.branchId,
      branchName: doc.branchName,
      reference: doc.reference,
      status: doc.status,
      paymentStatus: doc.paymentStatus,
      paymentMethod: doc.paymentMethod,
      initiator: doc.initiator,
      approver: doc.approver,
      rejectedBy: doc.rejectedBy,
      rejectedReasons: doc.rejectedReasons,
      address: doc.address,
      phoneNumber: doc.phoneNumber,
      products: doc.products,
      subtotal: doc.subtotal,
      deliveryFee: doc.deliveryFee,
      serviceCharge: doc.serviceCharge,
      discount: doc.discount,
      totalPrice: doc.totalPrice,
      approvedAt: doc.approvedAt?.toISOString() ?? null,
      rejectedAt: doc.rejectedAt?.toISOString() ?? null,
      cancelledAt: doc.cancelledAt?.toISOString() ?? null,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  async createRequest(data: CreateRequestDto, principal: SessionPrincipal) {
    const branch = await this.repository.findBranchById(data.branchId);
    if (!branch || branch.businessId !== principal.businessId) {
      throw new NotFoundException('Branch not found');
    }

    if (principal.user_type === 'employee' && principal.branchId !== data.branchId) {
      throw new NotFoundException('Branch not found');
    }

    const initiator = await this.buildActor(principal);

    if (!data.products?.length) {
      throw new BadRequestException('At least one product is required');
    }

    const products = data.products.map((product) => ({
      productId: product.productId ?? null,
      productName: product.productName.trim(),
      quantity: product.quantity,
      unitPrice: product.unitPrice,
      totalPrice: product.quantity * product.unitPrice,
      unit: product.unit?.trim() || null,
      imageUrl: product.imageUrl?.trim() || null,
      inStock: true,
    }));

    const subtotal = products.reduce((sum, product) => sum + product.totalPrice, 0);
    const deliveryFee = data.deliveryFee ?? 0;
    const serviceCharge = data.serviceCharge ?? 0;
    const discount = data.discount ?? 0;
    const totalPrice = subtotal + deliveryFee + serviceCharge - discount;

    if (totalPrice < 0) {
      throw new BadRequestException('Total price cannot be negative');
    }

    const created = await this.repository.createRequest({
      businessId: principal.businessId,
      branchId: branch._id,
      branchName: branch.branchName,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: data.paymentMethod?.trim() || null,
      initiator,
      approver: null,
      rejectedBy: null,
      rejectedReasons: null,
      address: {
        streetAddress: data.address.streetAddress.trim(),
        directions: data.address.directions?.trim() || undefined,
        state: data.address.state.trim(),
        lga: data.address.lga.trim(),
      },
      phoneNumber: data.phoneNumber.trim(),
      products,
      subtotal,
      deliveryFee,
      serviceCharge,
      discount,
      totalPrice,
      approvedAt: null,
      rejectedAt: null,
      cancelledAt: null,
    });

    return {
      status: true,
      message: 'Request created successfully',
      data: this.mapRequest(created),
    };
  }

  async listRequests(query: ListRequestsQueryDto, principal: SessionPrincipal) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 10));
    const statusFilter = parseRequestStatusFilter(query.status);

    const all = await this.repository.findRequestsForPrincipal(principal, {
      search: query.search,
      branchId: query.branchId,
      amountFrom: query.amountFrom,
      amountTo: query.amountTo,
      ...statusFilter,
    });

    const total = all.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const normalizedPage = Math.min(page, totalPages);
    const offset = (normalizedPage - 1) * limit;
    const data = all.slice(offset, offset + limit).map((request) => this.mapRequest(request));

    return {
      status: true,
      message: 'Requests fetched successfully',
      data,
      meta: {
        page: normalizedPage,
        limit,
        total,
        totalPages,
        hasNextPage: normalizedPage < totalPages,
        hasPrevPage: normalizedPage > 1,
      },
    };
  }

  async getRequestById(requestId: string, principal: SessionPrincipal) {
    const request = await this.repository.findRequestById(requestId);
    if (!request || request.businessId !== principal.businessId) {
      throw new NotFoundException('Request not found');
    }

    if (principal.user_type === 'employee') {
      if (request.branchId !== principal.branchId) {
        throw new NotFoundException('Request not found');
      }

      if (request.initiator.accountId !== principal.employeeId) {
        throw new NotFoundException('Request not found');
      }
    }

    return {
      status: true,
      message: 'Request fetched successfully',
      data: this.mapRequest(request),
    };
  }

  async approveRequest(
    requestId: string,
    data: UpdateRequestPaymentDto,
    principal: SessionPrincipal,
  ) {
    if (principal.user_type !== 'customer') {
      throw new BadRequestException('Only business super admins can approve requests');
    }

    const request = await this.repository.findRequestById(requestId);
    if (!request || request.businessId !== principal.businessId) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException('Only pending requests can be approved');
    }

    const actor = await this.buildActor(principal);
    const updated = await this.repository.updateRequestStatus(requestId, {
      status: 'approved',
      paymentStatus: data.paymentStatus ?? request.paymentStatus,
      paymentMethod: data.paymentMethod?.trim() || request.paymentMethod,
      approver: actor,
      approvedAt: new Date(),
      rejectedBy: null,
      rejectedReasons: null,
      rejectedAt: null,
    });

    return {
      status: true,
      message: 'Request approved successfully',
      data: this.mapRequest(updated),
    };
  }

  async rejectRequest(
    requestId: string,
    data: RejectRequestDto,
    principal: SessionPrincipal,
  ) {
    if (principal.user_type !== 'customer') {
      throw new BadRequestException('Only business super admins can reject requests');
    }

    const request = await this.repository.findRequestById(requestId);
    if (!request || request.businessId !== principal.businessId) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException('Only pending requests can be rejected');
    }

    const actor = await this.buildActor(principal);
    const updated = await this.repository.updateRequestStatus(requestId, {
      status: 'rejected',
      rejectedBy: actor,
      rejectedReasons: data.rejectionReasons.trim(),
      rejectedAt: new Date(),
      approver: null,
      approvedAt: null,
    });

    return {
      status: true,
      message: 'Request rejected successfully',
      data: this.mapRequest(updated),
    };
  }

  async cancelRequest(requestId: string, principal: SessionPrincipal) {
    const request = await this.repository.findRequestById(requestId);
    if (!request || request.businessId !== principal.businessId) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException('Only pending requests can be cancelled');
    }

    if (
      principal.user_type === 'employee' &&
      request.initiator.user_type === 'employee' &&
      request.initiator.accountId !== principal.employeeId
    ) {
      throw new BadRequestException('You can only cancel requests you created');
    }

    const updated = await this.repository.updateRequestStatus(requestId, {
      status: 'cancelled',
      cancelledAt: new Date(),
    });

    return {
      status: true,
      message: 'Request cancelled successfully',
      data: this.mapRequest(updated),
    };
  }
}
