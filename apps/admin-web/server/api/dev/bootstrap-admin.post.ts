import { readBody } from 'h3';
import { bootstrapDevAdmin } from '../../utils/dev-bootstrap-admin';

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    roleName?: string;
  }>(event);

  return await bootstrapDevAdmin(event, {
    firstName: body.firstName ?? '',
    lastName: body.lastName ?? '',
    email: body.email ?? '',
    password: body.password ?? '',
    roleName: body.roleName,
  });
});
