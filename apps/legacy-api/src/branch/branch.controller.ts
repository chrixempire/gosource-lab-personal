import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { BranchService } from './branch.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { AuthGuard } from '../auth/auth.guard';
import { SuperAdminGuard } from '../business/guard/role.guard';
import { Business } from '../business/decorator/business.decorator';

@UseGuards(AuthGuard)
@Controller('branch')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @UseGuards(SuperAdminGuard)
  @Post()
  async createBranch(
    @Body() branchDetails: CreateBranchDto,
    @Business() business: any,
  ) {
    return await this.branchService.createBranch(branchDetails, business.id);
  }

  @Get()
  async getAllBranches(@Business() business: any) {
    return this.branchService.getAllBranches(business.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Business() business: any) {
    return await this.branchService.getBranchById(id, business.id);
  }

  @UseGuards(SuperAdminGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
    @Business() business: any,
  ) {
    return await this.branchService.update(id, business.id, updateBranchDto);
  }

  @UseGuards(SuperAdminGuard)
  @Patch(':id/headquarter')
  async makeBranchHeadquarter(
    @Business() business: any,
    @Param('id') branchId: string,
  ) {
    return await this.branchService.makeBranchHeadquarter(
      branchId,
      business.id,
    );
  }

  @UseGuards(SuperAdminGuard)
  @Patch(':id/deactivate')
  async deactivateBranch(
    @Business() business: any,
    @Param('id') branchId: string,
  ) {
    return await this.branchService.deactivateBranch(branchId, business.id);
  }

  @UseGuards(SuperAdminGuard)
  @Patch(':id/activate')
  async activateBranch(
    @Business() business: any,
    @Param('id') branchId: string,
  ) {
    return await this.branchService.activateBranch(branchId, business.id);
  }

  @UseGuards(SuperAdminGuard)
  @Delete(':id')
  async deleteBranch(@Business() business: any, @Param('id') branchId: string) {
    return await this.branchService.removeBranch(branchId, business.id);
  }
}
