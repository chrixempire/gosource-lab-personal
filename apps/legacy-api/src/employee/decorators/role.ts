import { SetMetadata } from '@nestjs/common';
import { EmployeeRole } from '../interface/employee.interface';

export const Roles = (...roles: EmployeeRole[]) => SetMetadata('roles', roles);
