import { Module } from '@nestjs/common';
import { BranchController } from './branch.controller';
import { BranchRepository } from './branch.repository';
import { BranchService } from './branch.service';
import { CustomerAuthGuard } from './customer-auth.guard';

@Module({
  controllers: [BranchController],
  providers: [BranchRepository, BranchService, CustomerAuthGuard],
})
export class BranchModule {}
