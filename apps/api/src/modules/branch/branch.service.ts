import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateBranchDto } from './branch.dto';
import type { ListBranchesQueryDto, UpdateBranchDto } from './branch.dto';
import { BranchRepository } from './branch.repository';
import type { SessionPrincipal } from '../auth/session-auth.guard';

@Injectable()
export class BranchService {
  constructor(private readonly repository: BranchRepository) {}

  private withBranchMetrics<T extends object>(branch: T, membersCount: number) {
    return {
      ...branch,
      totalAmountProcured: 0,
      totalItemsPurchased: 0,
      totalOrders: 0,
      membersCount,
    };
  }

  async getBusinessBranches(
    principal: SessionPrincipal,
    query: ListBranchesQueryDto,
  ) {
    const business = await this.repository.findBusinessById(principal.businessId);

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (principal.user_type === 'employee') {
      const branch = await this.repository.findBranchById(principal.branchId);

      if (!branch || branch.businessId !== principal.businessId) {
        throw new NotFoundException('Branch not found');
      }

      const search = query.search?.trim().toLowerCase() || '';
      const matchesSearch =
        !search ||
        [branch.branchName, branch.branchCode, branch.streetName, branch.lga]
          .some((value) => value.toLowerCase().includes(search));
      const membersCount = await this.repository.countMembersForBranch(branch.id);
      const data = matchesSearch ? [this.withBranchMetrics(branch, membersCount)] : [];

      return {
        status: true,
        message: 'Branches fetched successfully',
        data,
        meta: {
          page: 1,
          limit: query.limit ?? 10,
          total: data.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 10));
    const search = query.search?.trim() || undefined;
    const total = await this.repository.countBranchesForBusiness(principal.businessId, search);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const normalizedPage = Math.min(page, totalPages);
    const branches = await this.repository.findBranchesForBusiness(principal.businessId, {
      page: normalizedPage,
      limit,
      search,
    });
    const membersByBranch = await this.repository.countMembersForBranchIds(
      branches.map((branch) => branch.id),
    );
    const branchesWithMetrics = branches.map((branch) =>
      this.withBranchMetrics(branch, membersByBranch.get(branch.id) ?? 0),
    );

    return {
      status: true,
      message: 'Branches fetched successfully',
      data: branchesWithMetrics,
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

  async getBranchById(branchId: string, principal: SessionPrincipal) {
    const branch = await this.repository.findBranchById(branchId);

    if (!branch || branch.businessId !== principal.businessId) {
      throw new NotFoundException('Branch not found');
    }

    if (principal.user_type === 'employee' && principal.branchId !== branchId) {
      throw new NotFoundException('Branch not found');
    }

    const membersCount = await this.repository.countMembersForBranch(branchId);

    return {
      status: true,
      message: 'Branch fetched successfully',
      data: this.withBranchMetrics(branch, membersCount),
    };
  }

  async createBranch(
    branchDetails: CreateBranchDto,
    customer: { businessId: string },
  ) {
    const business = await this.repository.findBusinessById(customer.businessId);

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const branchName = branchDetails.branchName.trim();
    const streetName = branchDetails.streetName.trim();
    const lga = branchDetails.lga.trim();

    const existingBranch = await this.repository.findBranchByNameForBusiness(
      customer.businessId,
      branchName,
    );

    if (existingBranch) {
      throw new BadRequestException('A branch with this name already exists');
    }

    const existingAddress = await this.repository.findBranchByAddressForBusiness(
      customer.businessId,
      streetName,
      lga,
    );

    if (existingAddress) {
      throw new BadRequestException(
        'A branch with this address already exists for this business',
      );
    }

    const totalBranches = await this.repository.countBranchesForBusiness(
      customer.businessId,
    );

    const branchCode = `${business.name.slice(0, 3)}-${Math.floor(
      100000 + Math.random() * 900000,
    )}`
      .replace(/\s+/g, '')
      .toUpperCase();

    const branch = await this.repository.createBranch({
      businessId: customer.businessId,
      branchCode,
      isHeadquarter: totalBranches === 0,
      branch: {
        branchName,
        streetName,
        lga,
      },
    });

    if (!branch) {
      throw new BadRequestException('Unable to create branch right now');
    }

    const membersCount = await this.repository.countMembersForBranch(branch.id);

    return {
      status: true,
      message: 'Branch created successfully',
      data: this.withBranchMetrics(branch, membersCount),
    };
  }

  async updateBranch(
    branchId: string,
    branchDetails: UpdateBranchDto,
    customer: { businessId: string },
  ) {
    const branch = await this.repository.findBranchById(branchId);

    if (!branch || branch.businessId !== customer.businessId) {
      throw new NotFoundException('Branch not found');
    }

    const branchName = branchDetails.branchName.trim();
    const streetName = branchDetails.streetName.trim();
    const lga = branchDetails.lga.trim();

    const existingBranch = await this.repository.findBranchByNameForBusiness(
      customer.businessId,
      branchName,
      branchId,
    );

    if (existingBranch) {
      throw new BadRequestException('A branch with this name already exists');
    }

    const existingAddress = await this.repository.findBranchByAddressForBusiness(
      customer.businessId,
      streetName,
      lga,
      branchId,
    );

    if (existingAddress) {
      throw new BadRequestException(
        'A branch with this address already exists for this business',
      );
    }

    const updatedBranch = await this.repository.updateBranch(branchId, {
      branchName,
      streetName,
      lga,
    });

    if (!updatedBranch) {
      throw new BadRequestException('Unable to update branch right now');
    }

    const membersCount = await this.repository.countMembersForBranch(branchId);

    return {
      status: true,
      message: 'Branch updated successfully',
      data: this.withBranchMetrics(updatedBranch, membersCount),
    };
  }

  async deactivateBranch(branchId: string, customer: { businessId: string }) {
    const branch = await this.repository.findBranchById(branchId);

    if (!branch || branch.businessId !== customer.businessId) {
      throw new NotFoundException('Branch not found');
    }

    if (branch.isDeactivated) {
      const membersCount = await this.repository.countMembersForBranch(branchId);
      return {
        status: true,
        message: 'Branch already deactivated',
        data: this.withBranchMetrics(branch, membersCount),
      };
    }

    const updatedBranch = await this.repository.deactivateBranch(branchId);

    if (!updatedBranch) {
      throw new BadRequestException('Unable to deactivate branch right now');
    }

    const membersCount = await this.repository.countMembersForBranch(branchId);

    return {
      status: true,
      message: 'Branch deactivated successfully',
      data: this.withBranchMetrics(updatedBranch, membersCount),
    };
  }

  async activateBranch(branchId: string, customer: { businessId: string }) {
    const branch = await this.repository.findBranchById(branchId);

    if (!branch || branch.businessId !== customer.businessId) {
      throw new NotFoundException('Branch not found');
    }

    if (!branch.isDeactivated) {
      const membersCount = await this.repository.countMembersForBranch(branchId);
      return {
        status: true,
        message: 'Branch already active',
        data: this.withBranchMetrics(branch, membersCount),
      };
    }

    const updatedBranch = await this.repository.activateBranch(branchId);

    if (!updatedBranch) {
      throw new BadRequestException('Unable to activate branch right now');
    }

    const membersCount = await this.repository.countMembersForBranch(branchId);

    return {
      status: true,
      message: 'Branch activated successfully',
      data: this.withBranchMetrics(updatedBranch, membersCount),
    };
  }

  async deleteBranch(branchId: string, customer: { businessId: string }) {
    const branch = await this.repository.findBranchById(branchId);

    if (!branch || branch.businessId !== customer.businessId) {
      throw new NotFoundException('Branch not found');
    }

    if (branch.isHeadquarter) {
      throw new BadRequestException('Headquarter branch cannot be deleted');
    }

    const employeeCount = await this.repository.countEmployeeAccountsForBranch(branchId);
    if (employeeCount > 0) {
      throw new BadRequestException('This branch cannot be deleted while it still has members');
    }

    const inviteCount = await this.repository.countEmployeeInvitesForBranch(branchId);
    if (inviteCount > 0) {
      throw new BadRequestException(
        'This branch cannot be deleted while it still has pending member invites',
      );
    }

    await this.repository.deleteBranch(branchId);

    return {
      status: true,
      message: 'Branch deleted successfully',
      data: { id: branchId },
    };
  }
}
