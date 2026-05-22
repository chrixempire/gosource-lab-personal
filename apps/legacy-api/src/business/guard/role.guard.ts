import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class SuperAdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    if (request.user.role !== 'Super Admin') {
      throw new UnauthorizedException(
        'You are not allowed to carry out this operation',
      );
    }

    return true;
  }
}
