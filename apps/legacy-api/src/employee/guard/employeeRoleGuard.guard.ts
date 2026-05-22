import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class EmployeeRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowedRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );

    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const userRoles = request.user.roles;
    const updatedUserRole = userRoles.map((userRole) => {
      return userRole.role;
    });

    const hasRole: boolean = allowedRoles.some((role) =>
      updatedUserRole.includes(role),
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `You don't have the permission to perform this operation`,
      );
    }

    return true;
  }
}
