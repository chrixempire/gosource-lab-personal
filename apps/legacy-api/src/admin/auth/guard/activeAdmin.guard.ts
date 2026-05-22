import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AdminUser, AdminUserDocument } from '../schema/adminUser.schema';
import { AdminAccountStatus } from '../enum/admin.enum';

@Injectable()
export class ActiveAdminGuard implements CanActivate {
  constructor(
    @InjectModel(AdminUser.name)
    private readonly adminUserModel: Model<AdminUserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const userId = user.id || user.userId || user.sub;
    if (!userId) {
      throw new UnauthorizedException('Invalid user token');
    }

    const admin = await this.adminUserModel
      .findById(userId)
      .populate('roleId');

    if (!admin) {
      throw new UnauthorizedException('Admin user not found');
    }

    if (admin.status !== AdminAccountStatus.ACTIVE) {
      throw new ForbiddenException('Admin account is not active');
    }

    // Attach to request for subsequent guards to use
    request.adminUser = admin;

    return true;
  }
}
