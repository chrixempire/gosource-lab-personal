import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from './entities/role.entity';
import { AdminUser, AdminUserSchema } from '../auth/schema/adminUser.schema';
import { ActivityModule } from '../../activity/activity.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Role.name, schema: RoleSchema },
      { name: AdminUser.name, schema: AdminUserSchema },
    ]),
    ActivityModule,
  ],
  controllers: [RoleController],
  providers: [RoleService],
})
export class RoleModule {}
