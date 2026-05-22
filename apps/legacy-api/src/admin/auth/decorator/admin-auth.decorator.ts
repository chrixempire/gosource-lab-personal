import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../auth/auth.guard';
import { ActiveAdminGuard } from '../guard/activeAdmin.guard';

/**
 * Custom decorator that combines AuthGuard and ActiveAdminGuard
 * to ensure the user is authenticated and has an active admin account.
 */
export function AdminAuth() {
  return applyDecorators(UseGuards(AuthGuard, ActiveAdminGuard));
}
