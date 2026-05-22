import type { ExecutionContext } from '@nestjs/common';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';
import { verifyToken } from './auth-token.util';

export type SessionPrincipal =
  | {
      user_type: 'customer';
      accountId: string;
      businessId: string;
      email: string;
      role: 'super_admin';
    }
  | {
      user_type: 'employee';
      employeeId: string;
      businessId: string;
      email: string;
      branchId: string;
      role: 'manager' | 'employee';
    };

type SessionRequest = {
  headers: {
    authorization?: string;
  };
  sessionPrincipal?: SessionPrincipal;
};

@Injectable()
export class SessionAuthGuard {
  constructor(private readonly configService: ConfigService<Env, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<SessionRequest>();
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication token is required');
    }

    const token = header.slice('Bearer '.length).trim();
    const payload = verifyToken(
      token,
      this.configService.get('AUTH_TOKEN_SECRET', { infer: true }),
    );

    if (payload.user_type === 'customer' && payload.businessId) {
      request.sessionPrincipal = {
        user_type: 'customer',
        accountId: payload.sub,
        businessId: payload.businessId,
        email: payload.email,
        role: 'super_admin',
      };
      return true;
    }

    if (
      payload.user_type === 'employee' &&
      payload.businessId &&
      (payload.role === 'manager' || payload.role === 'employee')
    ) {
      request.sessionPrincipal = {
        user_type: 'employee',
        employeeId: payload.sub,
        businessId: payload.businessId,
        email: payload.email,
        branchId: payload.branchId ?? '',
        role: payload.role,
      };
      return true;
    }

    throw new UnauthorizedException('A valid session is required');
  }
}
