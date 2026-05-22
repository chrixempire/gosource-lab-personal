import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';
import { hashPassword } from './password.util';
import { AdminAuthRepository } from './admin-auth.repository';

@Injectable()
export class DevAdminSeedService implements OnModuleInit {
  private readonly logger = new Logger(DevAdminSeedService.name);

  constructor(
    private readonly configService: ConfigService<Env, true>,
    private readonly repository: AdminAuthRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    const nodeEnv = this.configService.get('NODE_ENV', { infer: true });
    if (nodeEnv !== 'development') {
      return;
    }

    const seedEnabled = this.configService.get('DEV_ADMIN_SEED_ENABLED', { infer: true });
    if (!seedEnabled) {
      this.logger.log('Skipping development admin seed because DEV_ADMIN_SEED_ENABLED is not set.');
      return;
    }

    const existingAdmin = await this.repository.findAnyAdmin();
    if (existingAdmin) {
      return;
    }

    const role = await this.repository.ensureRole('super_admin');
    const email = this.configService.get('DEV_ADMIN_EMAIL', { infer: true });
    const password = this.configService.get('DEV_ADMIN_PASSWORD', { infer: true });

    if (!email || !password) {
      this.logger.warn(
        'Skipping development admin seed because DEV_ADMIN_EMAIL and DEV_ADMIN_PASSWORD must both be set.',
      );
      return;
    }

    if (password === 'password123') {
      this.logger.warn(
        'Skipping development admin seed because DEV_ADMIN_PASSWORD is using the known default password123.',
      );
      return;
    }

    await this.repository.createAdmin({
      firstName: 'GoSource',
      lastName: 'Admin',
      email,
      phoneNumber: '08000000000',
      passwordHash: hashPassword(password),
      roleId: role.id,
      status: 'active',
    });

    this.logger.log(`Seeded development admin user: ${email}`);
  }
}
