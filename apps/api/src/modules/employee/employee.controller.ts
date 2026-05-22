import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CustomerAuthGuard } from '../branch/customer-auth.guard';
import { Customer } from '../branch/customer.decorator';
import { EmployeeInvite } from './employee-invite.decorator';
import { EmployeeInviteGuard } from './employee-invite.guard';
import {
  InviteEmployeeDto,
  ListBranchMembersQueryDto,
  ResendEmployeeInviteDto,
  SetupEmployeeAccountDto,
  UpdateEmployeeDto,
} from './employee.dto';
import { EmployeeService } from './employee.service';
import { SessionAuthGuard, type SessionPrincipal } from '../auth/session-auth.guard';
import { SessionPrincipalParam } from '../auth/session-principal.decorator';
import { RateLimit } from '../../common/rate-limit.decorator';
import { RateLimitGuard } from '../../common/rate-limit.guard';

@Controller('employee')
@UseGuards(RateLimitGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @UseGuards(CustomerAuthGuard)
  @Post('invite')
  @RateLimit({ limit: 10, windowMs: 60_000 })
  inviteEmployee(
    @Body() data: InviteEmployeeDto,
    @Customer() customer: { businessId: string },
  ) {
    return this.employeeService.inviteEmployee(data, customer);
  }

  @UseGuards(CustomerAuthGuard)
  @Delete('invite/:invitationId')
  @RateLimit({ limit: 10, windowMs: 60_000 })
  cancelEmployeeInvite(
    @Param('invitationId') invitationId: string,
    @Customer() customer: { businessId: string },
  ) {
    return this.employeeService.cancelEmployeeInvite(invitationId, customer);
  }

  @UseGuards(CustomerAuthGuard)
  @Post('invite/:invitationId/resend')
  @RateLimit({ limit: 10, windowMs: 60_000 })
  resendEmployeeInvite(
    @Param('invitationId') invitationId: string,
    @Body() body: ResendEmployeeInviteDto,
    @Customer() customer: { businessId: string },
  ) {
    return this.employeeService.resendEmployeeInvite(invitationId, customer, body);
  }

  @UseGuards(CustomerAuthGuard)
  @Post('invite/:invitationId/link')
  @RateLimit({ limit: 10, windowMs: 60_000 })
  refreshEmployeeInviteLink(
    @Param('invitationId') invitationId: string,
    @Customer() customer: { businessId: string },
  ) {
    return this.employeeService.refreshEmployeeInviteLink(invitationId, customer);
  }

  @UseGuards(SessionAuthGuard)
  @Get('branch/:branchId')
  listBranchMembers(
    @Param('branchId') branchId: string,
    @Query() query: ListBranchMembersQueryDto,
    @SessionPrincipalParam() principal: SessionPrincipal,
  ) {
    return this.employeeService.listBranchMembers(branchId, query, principal);
  }

  @UseGuards(EmployeeInviteGuard)
  @Get('invite/:invitationId')
  @RateLimit({ limit: 15, windowMs: 60_000 })
  getInvitationDetails(
    @Param('invitationId') invitationId: string,
    @EmployeeInvite() inviteAuth: { invitationId: string; email: string; businessId: string },
  ) {
    return this.employeeService.getInvitationDetails(invitationId, inviteAuth);
  }

  @UseGuards(EmployeeInviteGuard)
  @Post('setup-account')
  @RateLimit({ limit: 10, windowMs: 60_000 })
  setupAccount(
    @Body() data: SetupEmployeeAccountDto,
    @EmployeeInvite() inviteAuth: { invitationId: string; email: string; businessId: string },
  ) {
    return this.employeeService.setupAccount(data, inviteAuth);
  }

  @UseGuards(CustomerAuthGuard)
  @Patch(':employeeId/deactivate')
  deactivateEmployee(
    @Param('employeeId') employeeId: string,
    @Customer() customer: { businessId: string },
  ) {
    return this.employeeService.deactivateEmployee(employeeId, customer);
  }

  @UseGuards(CustomerAuthGuard)
  @Patch(':employeeId/reactivate')
  reactivateEmployee(
    @Param('employeeId') employeeId: string,
    @Customer() customer: { businessId: string },
  ) {
    return this.employeeService.reactivateEmployee(employeeId, customer);
  }

  @UseGuards(CustomerAuthGuard)
  @Patch(':employeeId')
  updateEmployee(
    @Param('employeeId') employeeId: string,
    @Body() data: UpdateEmployeeDto,
    @Customer() customer: { businessId: string },
  ) {
    return this.employeeService.updateEmployee(employeeId, data, customer);
  }

  @UseGuards(SessionAuthGuard)
  @Get(':employeeId')
  getEmployee(
    @Param('employeeId') employeeId: string,
    @SessionPrincipalParam() principal: SessionPrincipal,
  ) {
    return this.employeeService.getEmployeeForSession(employeeId, principal);
  }

  @UseGuards(CustomerAuthGuard)
  @Delete(':employeeId')
  deleteEmployee(
    @Param('employeeId') employeeId: string,
    @Customer() customer: { businessId: string },
  ) {
    return this.employeeService.deleteEmployee(employeeId, customer);
  }
}
