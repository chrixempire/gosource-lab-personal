import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';
import { signToken } from './token.util';
import { verifyPassword } from './password.util';
import { AdminLoginDto } from './admin-auth.dto';
import type { AdminSessionUser } from './admin-auth.types';
import { AdminAuthRepository } from './admin-auth.repository';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly configService: ConfigService<Env, true>,
    private readonly repository: AdminAuthRepository,
  ) {}

  async login(data: AdminLoginDto) {
    const email = data.email.trim().toLowerCase();
    const password = data.password.trim();

    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const admin = await this.repository.findAdminByEmail(email);

    if (!admin) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!admin.passwordHash) {
      throw new BadRequestException('Admin has not setup password');
    }

    if (admin.status !== 'active' || !admin.roleIsActive) {
      throw new UnauthorizedException('Admin account is not active');
    }

    if (!verifyPassword(password, admin.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const user: AdminSessionUser = {
      id: admin.id,
      role: admin.roleName,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      phoneNumber: admin.phoneNumber,
    };

    return {
      message: 'Admin login successful',
      data: user,
      access_token: signToken(
        {
          sub: admin.id,
          email: admin.email,
          role: admin.roleName,
        },
        this.configService.get('AUTH_TOKEN_SECRET', { infer: true }),
      ),
    };
  }
}
