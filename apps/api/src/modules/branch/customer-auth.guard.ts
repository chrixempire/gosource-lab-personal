import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';
import { verifyToken } from '../auth/auth-token.util';

type CustomerRequest = {
  headers: {
    authorization?: string;
  };
  customer?: {
    accountId: string;
    businessId: string;
    email: string;
    role: string;
  };
};

@Injectable()
export class CustomerAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService<Env, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<CustomerRequest>();
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication token is required');
    }

    const token = header.slice('Bearer '.length).trim();
    const payload = verifyToken(
      token,
      this.configService.get('AUTH_TOKEN_SECRET', { infer: true }),
    );

    if (payload.user_type !== 'customer' || payload.role !== 'super_admin' || !payload.businessId) {
      throw new UnauthorizedException('Customer access is required');
    }

    request.customer = {
      accountId: payload.sub,
      businessId: payload.businessId,
      email: payload.email,
      role: payload.role,
    };

    return true;
  }
}
