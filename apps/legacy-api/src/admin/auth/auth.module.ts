import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminUser, AdminUserSchema } from './schema/adminUser.schema';
import { AdminRole, AdminRoleSchema } from './schema/adminRole.schema';
import {
  AdminUserRole,
  AdminUserRoleSchema,
} from './schema/adminUserRole.schema';
import { EmailService } from '../../notification/email/email.service';
import { JwtModule } from '@nestjs/jwt';
import { AdminOtp, AdminOtpSchema } from './schema/otp.schema';
import { Role, RoleSchema } from '../role/entities/role.entity';
import { AdminRolesGuard } from './guard/adminRole.guard';
import { ActivityModule } from '../../activity/activity.module';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AdminUser.name, schema: AdminUserSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AdminUserRole.name, schema: AdminUserRoleSchema },
      { name: AdminOtp.name, schema: AdminOtpSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '5000h' },
    }),
    ActivityModule,
  ],
  providers: [AuthService, EmailService, AdminRolesGuard],
  controllers: [AuthController],
  exports: [MongooseModule, AuthService, AdminRolesGuard],
})
export class AdminAuthModule {}
