import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { validateEnv } from './config/env.validation';
import { MongoModule } from './infrastructure/mongo/mongo.module';
import { AdminAuthModule } from './modules/admin-auth/admin-auth.module';
import { AuthModule } from './modules/auth/auth.module';
import { BranchModule } from './modules/branch/branch.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { RequestModule } from './modules/request/request.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    MongoModule,
    HealthModule,
    AuthModule,
    AdminAuthModule,
    BranchModule,
    EmployeeModule,
    RequestModule,
  ],
})
export class AppModule {}
