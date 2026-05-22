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
import { EmployeeService } from './employee.service';
import {
  CreateEmployeeDto,
  InviteEmployeeDto,
} from './dto/create-employee.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LoginEmployeeDto } from './dto/login-employee.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Business } from '../business/decorator/business.decorator';
import { ChangeEmployeeRoleDto } from './dto/change-role.dto';
import { SuperAdminGuard } from '../business/guard/role.guard';
import { UpdateEmployeeDto } from './dto/edit-employee.dto';
import { ChangeEmployeeBranchDto } from './dto/update-employee.dto';
import { Employee } from './decorators/employee.decorator';

@ApiBearerAuth('JWT-auth')
@ApiTags('Employee')
@Controller('employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @UseGuards(AuthGuard, SuperAdminGuard)
  @Post('invite')
  async inviteEmployee(
    @Body() data: InviteEmployeeDto,
    @Business() business: any,
  ) {
    return await this.employeeService.inviteEmployee(data, business);
  }

  @UseGuards(AuthGuard)
  @Get('invite/:invitationId')
  async getInvitationDetails(@Param('invitationId') invitationId: string) {
    return await this.employeeService.getInvitationDetails(invitationId);
  }

  @UseGuards(AuthGuard)
  @Post('setup-account')
  async create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @Employee() auth: any,
  ) {
    return this.employeeService.setupAccount(
      createEmployeeDto,
      auth?.invitationId,
    );
  }

  @Get()
  @UseGuards(AuthGuard)
  async getBusinessEmployees(@Business() business: any) {
    return await this.employeeService.getBusinessEmployees(business);
  }

  @UseGuards(AuthGuard)
  @Get('branch/:branchId')
  async getBranchEmployees(
    @Param('branchId') branchId: string,
    @Business() business: any,
  ) {
    return await this.employeeService.getBranchEmployees(branchId, business.id);
  }

  @UseGuards(AuthGuard, SuperAdminGuard)
  @Get('branch-pending-invites/:branchId')
  async getPendingInvites(
    @Param('branchId') branchId: string,
    @Business() business: any,
  ) {
    return await this.employeeService.getPendingInviteByBranchId(
      branchId,
      business.id,
    );
  }

  @UseGuards(AuthGuard, SuperAdminGuard)
  @Get('business-pending-invites')
  async getPendingInvitesByBusiness(@Business() business: any) {
    return await this.employeeService.getPendingInviteByBusinessId(business.id);
  }

  @UseGuards(AuthGuard, SuperAdminGuard)
  @Delete('delete-pending-invite/:id')
  async deletePendingInvite(
    @Param('id') inviteId: string,
    @Business() business: any,
  ) {
    return await this.employeeService.deletePendingInvite(inviteId, business);
  }

  @UseGuards(AuthGuard, SuperAdminGuard)
  @Delete('invite/:id')
  async cancelInvite(
    @Param('id') inviteId: string,
    @Business() business: any,
  ) {
    return await this.employeeService.deletePendingInvite(inviteId, business);
  }

  @UseGuards(AuthGuard, SuperAdminGuard)
  @Post('invite/:id/resend')
  async resendInvite(
    @Param('id') inviteId: string,
    @Business() business: any,
    @Body() data: any,
  ) {
    return await this.employeeService.resendInvite(inviteId, business, data);
  }

  @UseGuards(AuthGuard, SuperAdminGuard)
  @Post('invite/:id/link')
  async refreshInviteLink(
    @Param('id') inviteId: string,
    @Business() business: any,
    @Body() data: any,
  ) {
    return await this.employeeService.generateInviteLink(
      inviteId,
      business,
      data?.callbackUrl,
    );
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async getSingleEmployee(@Param('id') id: string, @Business() business: any) {
    return await this.employeeService.getSingleEmployee(id, business.id);
  }

  @Post('login')
  async login(@Body() data: LoginEmployeeDto) {
    return await this.employeeService.login(data);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @Business() business: any,
  ) {
    return await this.employeeService.update(id, updateEmployeeDto, business.id);
  }

  @UseGuards(AuthGuard, SuperAdminGuard)
  @Patch(':id/deactivate')
  async deactivateEmployee(
    @Param('id') employeeId: string,
    @Business() business: any,
  ) {
    return await this.employeeService.deactivateEmployee(employeeId, business.id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/activate')
  async activateEmployee(
    @Param('id') employeeId: string,
    @Business() business: any,
  ) {
    return await this.employeeService.activateEmployee(employeeId, business.id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/reactivate')
  async reactivateEmployee(
    @Param('id') employeeId: string,
    @Business() business: any,
  ) {
    return await this.employeeService.activateEmployee(employeeId, business.id);
  }

  @UseGuards(AuthGuard, SuperAdminGuard)
  @Patch(':id/change-role')
  async changeRole(
    @Param('id') id: string,
    @Body() roleDetails: ChangeEmployeeRoleDto,
    @Business() business: any,
  ) {
    return await this.employeeService.changeRole(id, roleDetails, business.id);
  }

  @UseGuards(AuthGuard, SuperAdminGuard)
  @Patch(':employeeId/change-branch')
  async changeBranch(
    @Param('employeeId') id: string,
    @Body() data: ChangeEmployeeBranchDto,
    @Business() business: any,
  ) {
    return await this.employeeService.changeBranch(
      id,
      data.branchId,
      business.id,
    );
  }

  @UseGuards(AuthGuard, SuperAdminGuard)
  @Delete(':id')
  async deleteEmployee(
    @Param('id') employeeId: string,
    @Business() business: any,
  ) {
    return await this.employeeService.deleteEmployee(employeeId, business.id);
  }
}
