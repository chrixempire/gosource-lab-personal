import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AdminUser, AdminUserDocument } from '../schema/adminUser.schema';
import { Role, RoleDocument } from '../../role/entities/role.entity';
import { ROLES_KEY } from '../decorator/role.decorator';
import {
  isSuperAdminRoleName,
  normalizeRoleName,
  roleHasPermission,
} from './admin-role.helpers';

@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    @InjectModel(AdminUser.name)
    private readonly adminUserModel: Model<AdminUserDocument>,
    @InjectModel(Role.name)
    private readonly roleModel: Model<RoleDocument>,
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
      const user = await this.resolveRequestUser(request);

      const userId = user.id || user.userId || user.sub;
      if (!userId) {
        throw new UnauthorizedException('Invalid user token');
      }

      admin = await this.adminUserModel.findById(userId).populate('roleId');
    }

    if (!admin) {
      throw new ForbiddenException('Admin user not found');
    }

    const role = await this.resolveAdminRole(admin);
    const roleName = role?.name || (admin as { role?: string }).role;
    const permissions = Array.isArray(role?.permissions) ? role.permissions : [];

    if (
      isSuperAdminRoleName(roleName) ||
      isSuperAdminRoleName(request.user?.role)
    ) {
      return true;
    }

    const normalizedRoleName = normalizeRoleName(roleName);

    if (
      allowedRolesOrPermissions.some(
        (entry) => normalizeRoleName(entry) === normalizedRoleName,
      )
    ) {
      return true;
    }

    if (request.user?.roles) {
      const userRoles = request.user.roles.map(
        (entry: { role?: string }) => entry.role,
      );
      if (
        allowedRolesOrPermissions.some((entry) => userRoles.includes(entry))
      ) {
        return true;
      }
    }

    const jwtRole = normalizeRoleName(request.user?.role);
    if (
      jwtRole &&
      allowedRolesOrPermissions.some(
        (entry) => normalizeRoleName(entry) === jwtRole,
      )
    ) {
      return true;
    }

    const hasPermission = allowedRolesOrPermissions.some((entry) =>
      roleHasPermission(permissions, entry),
    );

    if (hasPermission) {
      return true;
    }

    throw new ForbiddenException(
      "You don't have the permission to perform this operation",
    );
  }

  private async resolveRequestUser(request: {
    user?: Record<string, unknown>;
    headers?: { authorization?: string };
  }): Promise<Record<string, unknown>> {
    if (request.user) {
      return request.user;
    }

    const [type, token] = request.headers?.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      const payload = await this.jwtService.verifyAsync<Record<string, unknown>>(
        token,
        {
          secret: process.env.JWT_SECRET,
        },
      );

      if (payload?.tokenType === 'refresh') {
        throw new UnauthorizedException('Invalid user token');
      }

      request.user = payload;
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid user token');
    }
  }

  private async resolveAdminRole(
    admin: AdminUserDocument,
  ): Promise<RoleDocument | null> {
    const populated = admin.roleId as unknown as RoleDocument | string | null;

    if (populated && typeof populated === 'object' && 'permissions' in populated) {
      return populated;
    }

    const roleId =
      typeof populated === 'string'
        ? populated
        : populated && typeof populated === 'object' && '_id' in populated
          ? String((populated as { _id?: unknown })._id ?? '')
          : admin.roleId
            ? String(admin.roleId)
            : '';

    if (!roleId) {
      return null;
    }

    return this.roleModel.findById(roleId).exec();
  }
}
