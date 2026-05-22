import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AdminUser, AdminUserDocument } from '../schema/adminUser.schema';
import { RoleDocument } from '../../role/entities/role.entity';
import { ROLES_KEY } from '../decorator/role.decorator';

@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(AdminUser.name)
    private readonly adminUserModel: Model<AdminUserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowedRolesOrPermissions = this.reflector.getAllAndOverride<
      string[]
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (!allowedRolesOrPermissions || allowedRolesOrPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    let admin = request.adminUser;

    if (!admin) {
      const user = request.user;
      if (!user) return false;
      const userId = user.id || user.userId || user.sub;
      admin = await this.adminUserModel.findById(userId).populate('roleId');
    }

    if (!admin) {
      throw new ForbiddenException('Admin user not found');
    }

    const role = admin.roleId as unknown as RoleDocument;
    const roleName = role?.name || (admin as any).role; // backward compatibility for adminUser with role property
    const permissions = role?.permissions || [];

    // Master bypass for Super Admin
    const superAdmins = ['super_admin', 'admin'];
    if (
      superAdmins.includes(roleName.toLowerCase()) ||
      superAdmins.includes(request.user?.role.toLowerCase())
    ) {
      return true;
    }

    // Check if role name matches any allowed role/permission
    if (allowedRolesOrPermissions.includes(roleName)) {
      return true;
    }

    // Plural roles check (legacy from JWT)
    if (request.user?.roles) {
      const userRoles = request.user.roles.map((r: any) => r.role);
      if (allowedRolesOrPermissions.some((r) => userRoles.includes(r))) {
        return true;
      }
    }

    // Check JWT role (legacy)
    if (
      request.user?.role &&
      allowedRolesOrPermissions.includes(request.user.role)
    ) {
      return true;
    }

    // Check Permissions
    const hasPermission = allowedRolesOrPermissions.some((p) =>
      permissions.includes(p),
    );

    if (hasPermission) {
      return true;
    }

    throw new ForbiddenException(
      "You don't have the permission to perform this operation",
    );
  }
}
