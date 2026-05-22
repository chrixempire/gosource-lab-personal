import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { signToken } from '../admin-auth/token.util';
import type { Env } from '../../config/env.validation';
import { hashPassword } from '../admin-auth/password.util';
import { generateRefreshToken } from '../auth/refresh-token.util';
import { AuthRepository } from '../auth/auth.repository';
import type {
  InviteEmployeeDto,
  ListBranchMembersQueryDto,
  ResendEmployeeInviteDto,
  SetupEmployeeAccountDto,
  UpdateEmployeeDto,
} from './employee.dto';
import { EmployeeRepository } from './employee.repository';
import type { SessionPrincipal } from '../auth/session-auth.guard';

@Injectable()
export class EmployeeService {
  private readonly logger = new Logger(EmployeeService.name);

  constructor(
    private readonly repository: EmployeeRepository,
    private readonly configService: ConfigService<Env, true>,
    private readonly authRepository: AuthRepository,
  ) {}

  private buildActivationUrl(callbackUrl: string, invitationId: string, email: string, businessId: string) {
    const token = signToken(
      {
        sub: invitationId,
        email,
        user_type: 'employee_invite',
        role: 'employee_invite',
        businessId,
      },
      this.configService.get('AUTH_TOKEN_SECRET', { infer: true }),
    );

    const url = new URL(callbackUrl);
    url.searchParams.set('token', token);
    url.searchParams.set('invitationId', invitationId);

    return {
      token,
      activationUrl: url.toString(),
    };
  }

  private getAllowedFrontendOrigins() {
    const configured = this.configService.get('FRONTEND_APP_ORIGINS', { infer: true });
    const defaults = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3002',
      'http://127.0.0.1:3002',
      'http://localhost:3003',
      'http://127.0.0.1:3003',
    ];

    if (!configured?.trim()) {
      return defaults;
    }

    return configured
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  private normalizeInviteCallbackUrl(callbackUrl: string) {
    let url: URL;

    try {
      url = new URL(callbackUrl.trim());
    } catch {
      throw new BadRequestException('Invite callback URL is invalid');
    }

    const allowedOrigins = this.getAllowedFrontendOrigins();
    if (!allowedOrigins.includes(url.origin)) {
      throw new BadRequestException('Invite callback URL origin is not allowed');
    }

    if (url.pathname !== '/auth/invite-user') {
      throw new BadRequestException('Invite callback URL path is not allowed');
    }

    url.search = '';
    url.hash = '';
    return url.toString();
  }

  private logDevInvite(email: string, activationUrl: string) {
    if (process.env.NODE_ENV === 'development') {
      this.logger.log(`Employee invite for ${email}`);
      console.log(`[DEV INVITE] ${email}: ${activationUrl}`);
    }
  }

  private normalizePhoneNumber(value: string) {
    return value.replace(/\D/g, '');
  }

  private getDatabaseErrorCode(error: unknown): string | undefined {
    if (typeof error !== 'object' || error === null) {
      return undefined;
    }
    const record = error as Record<string, unknown>;
    if (typeof record.code === 'string' || typeof record.code === 'number') {
      return String(record.code);
    }
    const cause = record.cause;
    if (typeof cause === 'object' && cause !== null) {
      const causeCode = (cause as Record<string, unknown>).code;
      if (typeof causeCode === 'string' || typeof causeCode === 'number') {
        return String(causeCode);
      }
    }
    return undefined;
  }

  private isDuplicateConstraintCode(code: string | undefined) {
    return code === '23505' || code === '11000';
  }

  async inviteEmployee(
    payload: InviteEmployeeDto,
    customer: { businessId: string },
  ) {
    const businessOwner = await this.repository.findCustomerByBusinessId(customer.businessId);

    if (!businessOwner) {
      throw new NotFoundException('Business account not found');
    }

    const branch = await this.repository.findBranchById(payload.branchId);

    if (!branch || branch.businessId !== customer.businessId) {
      throw new NotFoundException('Branch not found');
    }

    const email = payload.email.trim().toLowerCase();
    const callbackUrl = this.normalizeInviteCallbackUrl(payload.callbackUrl);

    const existingInvite = await this.repository.findInviteByBusinessBranchEmail(
      customer.businessId,
      payload.branchId,
      email,
    );

    if (existingInvite) {
      const { activationUrl } = this.buildActivationUrl(
        callbackUrl,
        existingInvite.id,
        email,
        customer.businessId,
      );
      this.logDevInvite(email, activationUrl);

      return {
        message: 'Employee invitation sent successfully',
        data: {
          invitationId: existingInvite.id,
          email,
          role: existingInvite.role,
          branchId: existingInvite.branchId,
          activationUrl,
        },
      };
    }

    const existingCustomer = await this.repository.findCustomerByEmail(email);
    if (existingCustomer) {
      throw new BadRequestException(
        'A business account already exists with this email, try to log in',
      );
    }

    const existingDifferentInvite = await this.repository.findInviteByEmail(email);
    if (existingDifferentInvite) {
      throw new BadRequestException('Invitation with this email already exists.');
    }

    let invite;
    try {
      invite = await this.repository.createInvite({
        ...payload,
        email,
        callbackUrl,
        businessId: customer.businessId,
      });
    } catch (error) {
      const code = this.getDatabaseErrorCode(error);
      if (this.isDuplicateConstraintCode(code)) {
        throw new BadRequestException('Invitation with this email already exists.');
      }
      throw error;
    }

    if (!invite) {
      throw new BadRequestException('Unable to create invitation right now');
    }

    const { activationUrl } = this.buildActivationUrl(
      callbackUrl,
      invite.id,
      email,
      customer.businessId,
    );
    this.logDevInvite(email, activationUrl);

    return {
      message: 'Employee invitation sent successfully',
      data: {
        invitationId: invite.id,
        email,
        role: invite.role,
        branchId: invite.branchId,
        activationUrl,
      },
    };
  }

  async cancelEmployeeInvite(
    invitationId: string,
    customer: { businessId: string },
  ) {
    const invite = await this.repository.findInviteById(invitationId);

    if (!invite || invite.businessId !== customer.businessId) {
      throw new NotFoundException('Invitation not found');
    }

    await this.repository.deleteInvite(invitationId);

    return {
      message: 'Invitation cancelled successfully',
      data: {
        invitationId,
      },
    };
  }

  private async regenerateInviteActivation(
    invitationId: string,
    customer: { businessId: string },
  ) {
    const invite = await this.repository.findInviteById(invitationId);

    if (!invite || invite.businessId !== customer.businessId) {
      throw new NotFoundException('Invitation not found');
    }

    const callbackUrl = invite.callbackUrl.trim();
    const email = invite.email.trim().toLowerCase();
    const { activationUrl } = this.buildActivationUrl(
      callbackUrl,
      invite.id,
      email,
      customer.businessId,
    );
    this.logDevInvite(email, activationUrl);
    await this.repository.touchInviteUpdatedAt(invitationId);

    return {
      invitationId: invite.id,
      email,
      role: invite.role,
      branchId: invite.branchId,
      activationUrl,
    };
  }

  async resendEmployeeInvite(
    invitationId: string,
    customer: { businessId: string },
    dto: ResendEmployeeInviteDto,
  ) {
    const invite = await this.repository.findInviteById(invitationId);

    if (!invite || invite.businessId !== customer.businessId) {
      throw new NotFoundException('Invitation not found');
    }

    const patch: { email?: string; role?: string } = {};

    if (dto.email !== undefined) {
      const nextEmail = dto.email.trim().toLowerCase();
      const current = invite.email.trim().toLowerCase();

      if (nextEmail !== current) {
        const duplicate = await this.repository.findInviteByBusinessBranchEmail(
          customer.businessId,
          invite.branchId,
          nextEmail,
        );

        if (duplicate && duplicate.id !== invitationId) {
          throw new BadRequestException('An invite for this email already exists on this branch');
        }

        patch.email = nextEmail;
      }
    }

    if (dto.role !== undefined && dto.role !== invite.role) {
      patch.role = dto.role;
    }

    if (Object.keys(patch).length > 0) {
      try {
        await this.repository.updateInvitePartial(invitationId, patch);
      } catch (error) {
        const code = this.getDatabaseErrorCode(error);
        if (this.isDuplicateConstraintCode(code)) {
          throw new BadRequestException('An invite for this email already exists on this branch');
        }
        throw error;
      }
    }

    const data = await this.regenerateInviteActivation(invitationId, customer);

    return {
      message:
        'Invitation link refreshed. Outbound email is not configured yet — share the new activation link with your teammate.',
      data,
    };
  }

  async refreshEmployeeInviteLink(invitationId: string, customer: { businessId: string }) {
    const data = await this.regenerateInviteActivation(invitationId, customer);

    return {
      message: 'Invitation link regenerated',
      data,
    };
  }

  async listBranchMembers(
    branchId: string,
    query: ListBranchMembersQueryDto,
    principal: SessionPrincipal,
  ) {
    const branch = await this.repository.findBranchById(branchId);

    if (!branch || branch.businessId !== principal.businessId) {
      throw new NotFoundException('Branch not found');
    }

    if (principal.user_type === 'employee' && principal.branchId !== branchId) {
      throw new NotFoundException('Branch not found');
    }

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 10));
    const [accounts, invites] = await Promise.all([
      this.repository.findEmployeeAccountsForBranch(branchId),
      this.repository.findEmployeeInvitesForBranch(branchId),
    ]);

    const rows = [
      ...accounts.map((member) => ({
        id: member.id,
        kind: 'member' as const,
        email: member.email,
        firstName: member.firstName,
        lastName: member.lastName,
        position: member.position,
        role: member.role,
        status: member.status,
        createdAt: member.createdAt,
      })),
      ...invites.map((invite) => ({
        id: invite.id,
        kind: 'invite' as const,
        email: invite.email,
        firstName: null,
        lastName: null,
        position: '',
        role: invite.role,
        status: 'pending',
        createdAt: invite.createdAt,
      })),
    ];

    const search = query.search?.trim().toLowerCase() ?? '';
    const filtered = search
      ? rows.filter((row) => {
          const name = [row.firstName ?? '', row.lastName ?? ''].filter(Boolean).join(' ');
          const parts = [row.email, name, row.position, row.role, row.status];
          return parts.some((part) => part.toLowerCase().includes(search));
        })
      : rows;

    const sorted = [...filtered].sort(
      (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    );

    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const normalizedPage = Math.min(page, totalPages);
    const offset = (normalizedPage - 1) * limit;
    const data = sorted.slice(offset, offset + limit);

    return {
      message: 'Branch members fetched successfully',
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

  async getInvitationDetails(
    invitationId: string,
    inviteAuth: { invitationId: string; email: string; businessId: string },
  ) {
    if (invitationId !== inviteAuth.invitationId) {
      throw new UnauthorizedException('Invitation does not match the provided token');
    }

    const invite = await this.repository.findInviteById(invitationId);

    if (!invite) {
      throw new NotFoundException('Invitation not found');
    }

    const inviteEmailNorm = invite.email.trim().toLowerCase();
    const tokenEmailNorm = inviteAuth.email.trim().toLowerCase();

    if (inviteEmailNorm !== tokenEmailNorm || invite.businessId !== inviteAuth.businessId) {
      throw new UnauthorizedException('Invitation does not match the provided token');
    }

    const branch = await this.repository.findBranchById(invite.branchId);
    const business = await this.repository.findBusinessById(invite.businessId);

    return {
      message: 'Invitation fetched successfully',
      data: {
        invitationId: invite.id,
        email: invite.email,
        role: invite.role,
        branchId: invite.branchId,
        branchName: branch?.branchName ?? null,
        businessName: business?.name ?? null,
      },
    };
  }

  async setupAccount(
    payload: SetupEmployeeAccountDto,
    inviteAuth: { invitationId: string; email: string; businessId: string },
  ) {
    if (
      !inviteAuth?.invitationId ||
      typeof inviteAuth.invitationId !== 'string' ||
      !inviteAuth?.email ||
      typeof inviteAuth.email !== 'string' ||
      !inviteAuth?.businessId ||
      typeof inviteAuth.businessId !== 'string'
    ) {
      throw new UnauthorizedException('Invitation token is missing required fields');
    }

    const invite = await this.repository.findInviteById(inviteAuth.invitationId);

    if (!invite) {
      throw new NotFoundException('Invitation not found');
    }

    const inviteEmail = invite.email.trim().toLowerCase();
    const tokenEmail = inviteAuth.email.trim().toLowerCase();

    if (inviteEmail !== tokenEmail || invite.businessId !== inviteAuth.businessId) {
      throw new UnauthorizedException('Invitation does not match the provided token');
    }

    const existingEmployee = await this.repository.findEmployeeByEmail(inviteEmail);
    if (existingEmployee) {
      throw new BadRequestException('Account already set up. Kindly sign in');
    }

    const normalizedPhoneNumber = this.normalizePhoneNumber(payload.phoneNumber);
    const existingPhone = await this.repository.findEmployeeByNormalizedPhone(normalizedPhoneNumber);
    if (existingPhone) {
      throw new BadRequestException('This phone number is already being used by another team member');
    }

    const existingCustomerPhone = await this.repository.findCustomerByNormalizedPhone(
      normalizedPhoneNumber,
    );
    if (existingCustomerPhone) {
      throw new BadRequestException(
        'This phone number is already being used by another account in GoSource',
      );
    }

    const passwordHash = hashPassword(payload.password);

    let employee;
    try {
      employee = await this.repository.createEmployeeAccount({
        businessId: invite.businessId,
        branchId: invite.branchId,
        email: inviteEmail,
        role: invite.role,
        position: payload.position?.trim() || '',
        firstName: payload.firstName.trim(),
        lastName: payload.lastName.trim(),
        phoneNumber: payload.phoneNumber.trim(),
        normalizedPhoneNumber,
        passwordHash,
      });
    } catch (error) {
      const code = this.getDatabaseErrorCode(error);
      if (this.isDuplicateConstraintCode(code)) {
        throw new BadRequestException(
          'This email or phone is already registered. Sign in if you already have an account.',
        );
      }
      if (code === '42703') {
        throw new ServiceUnavailableException(
          'Database schema is missing expected columns. Apply pending API migrations (pnpm db:migrate in apps/api) and retry.',
        );
      }
      this.logger.error(
        'Employee create failed during setup-account',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }

    await this.repository.deleteInvite(invite.id);

    const refresh = generateRefreshToken();
    const refreshExpiresAt = new Date(
      Date.now() +
        this.configService.get('AUTH_REFRESH_TOKEN_TTL_SECONDS', { infer: true }) * 1000,
    );

    await this.authRepository.createEmployeeSession({
      sessionId: refresh.sessionId,
      employeeAccountId: employee?.id ?? invite.id,
      refreshTokenHash: refresh.tokenHash,
      expiresAt: refreshExpiresAt,
    });

    return {
      message: 'Employee account set up successfully',
      user_type: 'employee' as const,
      data: {
        id: employee?.id ?? '',
        businessId: employee?.businessId ?? invite.businessId,
        branchId: employee?.branchId ?? invite.branchId,
        email: employee?.email ?? inviteEmail,
        role: employee?.role ?? invite.role,
        position: employee?.position ?? payload.position?.trim() ?? '',
        firstName: employee?.firstName ?? payload.firstName.trim(),
        lastName: employee?.lastName ?? payload.lastName.trim(),
        phoneNumber: employee?.phoneNumber ?? payload.phoneNumber.trim(),
        status: employee?.status ?? 'active',
      },
      access_token: signToken(
        {
          sub: employee?.id ?? invite.id,
          email: employee?.email ?? inviteEmail,
          user_type: 'employee',
          role: employee?.role ?? invite.role,
          businessId: employee?.businessId ?? invite.businessId,
          branchId: employee?.branchId ?? invite.branchId,
        },
        this.configService.get('AUTH_TOKEN_SECRET', { infer: true }),
      ),
      refresh_token: refresh.token,
    };
  }

  private asIso(value: Date | string | null | undefined): string | null {
    if (value == null) {
      return null;
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  private mapEmployeeAccountToDetail(employee: {
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
    verifiedAt: Date | string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
  }) {
    const createdAt = this.asIso(employee.createdAt);
    const updatedAt = this.asIso(employee.updatedAt);

    return {
      id: employee.id,
      businessId: employee.businessId,
      branchId: employee.branchId,
      email: employee.email,
      role: employee.role,
      position: employee.position,
      firstName: employee.firstName,
      lastName: employee.lastName,
      phoneNumber: employee.phoneNumber,
      status: employee.status,
      verifiedAt: this.asIso(employee.verifiedAt),
      createdAt: createdAt ?? new Date(0).toISOString(),
      updatedAt: updatedAt ?? new Date(0).toISOString(),
    };
  }

  async getEmployeeForSession(employeeId: string, principal: SessionPrincipal) {
    const employee = await this.repository.findEmployeeAccountById(employeeId);

    if (!employee || employee.businessId !== principal.businessId) {
      throw new NotFoundException('Employee not found');
    }

    if (principal.user_type === 'employee' && employee.branchId !== principal.branchId) {
      throw new NotFoundException('Employee not found');
    }

    return {
      message: 'Employee fetched successfully',
      data: this.mapEmployeeAccountToDetail(employee),
    };
  }

  async updateEmployee(
    employeeId: string,
    data: UpdateEmployeeDto,
    customer: { businessId: string },
  ) {
    const employee = await this.repository.findEmployeeAccountById(employeeId);

    if (!employee || employee.businessId !== customer.businessId) {
      throw new NotFoundException('Employee not found');
    }

    const patch: Partial<{
      firstName: string;
      lastName: string;
      phoneNumber: string;
      normalizedPhoneNumber: string;
      role: string;
      position: string;
      branchId: string;
    }> = {};

    if (data.firstName !== undefined) {
      patch.firstName = data.firstName.trim();
    }

    if (data.lastName !== undefined) {
      patch.lastName = data.lastName.trim();
    }

    if (data.position !== undefined) {
      patch.position = data.position.trim();
    }

    if (data.role !== undefined) {
      patch.role = data.role;
    }

    if (data.branchId !== undefined) {
      const branch = await this.repository.findBranchById(data.branchId);
      if (!branch || branch.businessId !== customer.businessId) {
        throw new NotFoundException('Branch not found');
      }

      patch.branchId = data.branchId;
    }

    if (data.phoneNumber !== undefined) {
      const trimmed = data.phoneNumber.trim();
      const normalizedPhoneNumber = this.normalizePhoneNumber(trimmed);
      const existingPhone = await this.repository.findEmployeeByNormalizedPhone(normalizedPhoneNumber);
      if (existingPhone && existingPhone.id !== employeeId) {
        throw new BadRequestException('This phone number is already being used by another team member');
      }

      const existingCustomerPhone =
        await this.repository.findCustomerByNormalizedPhone(normalizedPhoneNumber);
      if (existingCustomerPhone) {
        throw new BadRequestException(
          'This phone number is already being used by another account in GoSource',
        );
      }

      patch.phoneNumber = trimmed;
      patch.normalizedPhoneNumber = normalizedPhoneNumber;
    }

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    try {
      await this.repository.updateEmployeeAccountPartial(employeeId, patch);
    } catch (error) {
      const code = this.getDatabaseErrorCode(error);
      if (this.isDuplicateConstraintCode(code)) {
        throw new BadRequestException(
          'This email or phone is already registered. Sign in if you already have an account.',
        );
      }
      throw error;
    }

    const updated = await this.repository.findEmployeeAccountById(employeeId);
    if (!updated) {
      throw new NotFoundException('Employee not found');
    }

    return {
      message: 'Employee updated successfully',
      data: this.mapEmployeeAccountToDetail(updated),
    };
  }

  async deactivateEmployee(employeeId: string, customer: { businessId: string }) {
    const employee = await this.repository.findEmployeeAccountById(employeeId);

    if (!employee || employee.businessId !== customer.businessId) {
      throw new NotFoundException('Employee not found');
    }

    await this.repository.updateEmployeeAccountPartial(employeeId, { status: 'inactive' });

    const updated = await this.repository.findEmployeeAccountById(employeeId);
    if (!updated) {
      throw new NotFoundException('Employee not found');
    }

    return {
      message: 'Employee deactivated successfully',
      data: this.mapEmployeeAccountToDetail(updated),
    };
  }

  async reactivateEmployee(employeeId: string, customer: { businessId: string }) {
    const employee = await this.repository.findEmployeeAccountById(employeeId);

    if (!employee || employee.businessId !== customer.businessId) {
      throw new NotFoundException('Employee not found');
    }

    await this.repository.updateEmployeeAccountPartial(employeeId, { status: 'active' });

    const updated = await this.repository.findEmployeeAccountById(employeeId);
    if (!updated) {
      throw new NotFoundException('Employee not found');
    }

    return {
      message: 'Employee reactivated successfully',
      data: this.mapEmployeeAccountToDetail(updated),
    };
  }

  async deleteEmployee(employeeId: string, customer: { businessId: string }) {
    const employee = await this.repository.findEmployeeAccountById(employeeId);

    if (!employee || employee.businessId !== customer.businessId) {
      throw new NotFoundException('Employee not found');
    }

    await this.repository.deleteEmployeeAccount(employeeId);

    return {
      message: 'Employee removed successfully',
      data: { id: employeeId },
    };
  }
}
