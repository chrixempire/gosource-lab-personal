import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';
import { verifyToken } from '../auth/auth-token.util';

type InviteRequest = {
  headers: {
    authorization?: string;
  };
  employeeInvite?: {
    invitationId: string;
    email: string;
    businessId: string;
    role: string;
  };
};

@Injectable()
export class EmployeeInviteGuard implements CanActivate {
  constructor(private readonly configService: ConfigService<Env, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<InviteRequest>();
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invitation token is required');
    }

    const token = header.slice('Bearer '.length).trim();
    const payload = verifyToken(
      token,
      this.configService.get('AUTH_TOKEN_SECRET', { infer: true }),
    );

    if (
      payload.user_type !== 'employee_invite' ||
      typeof payload.businessId !== 'string' ||
      !payload.businessId ||
      typeof payload.sub !== 'string' ||
      !payload.sub ||
      typeof payload.email !== 'string' ||
      !payload.email
    ) {
      throw new UnauthorizedException('A valid employee invitation is required');
    }

    request.employeeInvite = {
      invitationId: payload.sub,
      email: payload.email,
      businessId: payload.businessId,
      role: payload.role,
    };

    return true;
  }
}
