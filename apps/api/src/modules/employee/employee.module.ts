import { Module } from '@nestjs/common';
import { EmployeeController } from './employee.controller';
import { EmployeeInviteGuard } from './employee-invite.guard';
import { EmployeeRepository } from './employee.repository';
import { EmployeeService } from './employee.service';
import { RateLimitGuard } from '../../common/rate-limit.guard';
import { AuthRepository } from '../auth/auth.repository';

@Module({
  controllers: [EmployeeController],
  providers: [EmployeeRepository, EmployeeService, EmployeeInviteGuard, RateLimitGuard, AuthRepository],
})
export class EmployeeModule {}
