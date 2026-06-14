import { RequiredPermission } from '../../role/enum/required-permission';
import { isSuperAdminRoleName, roleHasPermission } from './admin-role.helpers';

describe('admin-role.helpers', () => {
  it('recognizes super admin role name variants', () => {
    expect(isSuperAdminRoleName('super_admin')).toBe(true);
    expect(isSuperAdminRoleName('Super Admin')).toBe(true);
    expect(isSuperAdminRoleName('SuperAdmin')).toBe(true);
    expect(isSuperAdminRoleName('marketer')).toBe(false);
  });

  it('matches permissions case-insensitively', () => {
    expect(
      roleHasPermission(['view_discounts'], RequiredPermission.VIEW_DISCOUNTS),
    ).toBe(true);
    expect(
      roleHasPermission(['VIEW_DISCOUNTS'], RequiredPermission.VIEW_DISCOUNTS),
    ).toBe(true);
  });
});
