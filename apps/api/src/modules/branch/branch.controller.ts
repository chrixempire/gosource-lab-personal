import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { BranchService } from './branch.service';
import { CustomerAuthGuard } from './customer-auth.guard';
import { Customer } from './customer.decorator';
import { CreateBranchDto, ListBranchesQueryDto, UpdateBranchDto } from './branch.dto';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { SessionPrincipalParam } from '../auth/session-principal.decorator';
import type { SessionPrincipal } from '../auth/session-auth.guard';

@Controller('branch')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @UseGuards(SessionAuthGuard)
  @Get()
  list(
    @SessionPrincipalParam() principal: SessionPrincipal,
    @Query() query: ListBranchesQueryDto,
  ) {
    return this.branchService.getBusinessBranches(principal, query);
  }

  @UseGuards(SessionAuthGuard)
  @Get(':branchId')
  detail(
    @Param('branchId') branchId: string,
    @SessionPrincipalParam() principal: SessionPrincipal,
  ) {
    return this.branchService.getBranchById(branchId, principal);
  }

  @UseGuards(CustomerAuthGuard)
  @Post()
  createPrimary(
    @Body() branchDetails: CreateBranchDto,
    @Customer() customer: { businessId: string },
  ) {
    return this.branchService.createBranch(branchDetails, customer);
  }

  @UseGuards(CustomerAuthGuard)
  @Post('create')
  async createBranch(
    @Body() branchDetails: CreateBranchDto,
    @Customer() customer: { businessId: string },
  ) {
    return this.branchService.createBranch(branchDetails, customer);
  }

  @UseGuards(CustomerAuthGuard)
  @Patch(':branchId')
  updateBranch(
    @Param('branchId') branchId: string,
    @Body() branchDetails: UpdateBranchDto,
    @Customer() customer: { businessId: string },
  ) {
    return this.branchService.updateBranch(branchId, branchDetails, customer);
  }

  @UseGuards(CustomerAuthGuard)
  @Patch(':branchId/deactivate')
  deactivateBranch(
    @Param('branchId') branchId: string,
    @Customer() customer: { businessId: string },
  ) {
    return this.branchService.deactivateBranch(branchId, customer);
  }

  @UseGuards(CustomerAuthGuard)
  @Patch(':branchId/activate')
  activateBranch(
    @Param('branchId') branchId: string,
    @Customer() customer: { businessId: string },
  ) {
    return this.branchService.activateBranch(branchId, customer);
  }

  @UseGuards(CustomerAuthGuard)
  @Delete(':branchId')
  deleteBranch(
    @Param('branchId') branchId: string,
    @Customer() customer: { businessId: string },
  ) {
    return this.branchService.deleteBranch(branchId, customer);
  }
}
