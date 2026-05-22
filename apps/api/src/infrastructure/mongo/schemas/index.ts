import {
  ADMIN_USER_COLLECTION,
  adminUserIndexes,
} from './admin-user.schema';
import {
  BRANCH_COLLECTION,
  branchIndexes,
} from './branch.schema';
import {
  BUSINESS_CUSTOMER_COLLECTION,
  businessCustomerIndexes,
} from './business-customer.schema';
import {
  EMPLOYEE_INVITE_COLLECTION,
  employeeInviteIndexes,
} from './employee-invite.schema';
import {
  EMPLOYEE_COLLECTION,
  employeeIndexes,
} from './employee.schema';
import { OTP_COLLECTION, otpIndexes } from './otp.schema';
import { REQUEST_COLLECTION, requestIndexes } from './request.schema';
import { ROLE_COLLECTION, roleIndexes } from './role.schema';
import {
  CUSTOMER_SESSION_COLLECTION,
  customerSessionIndexes,
  EMPLOYEE_SESSION_COLLECTION,
  employeeSessionIndexes,
} from './session.schema';

export const mongoCollectionRegistry = [
  {
    name: BUSINESS_CUSTOMER_COLLECTION,
    indexes: businessCustomerIndexes,
  },
  {
    name: EMPLOYEE_COLLECTION,
    indexes: employeeIndexes,
  },
  {
    name: EMPLOYEE_INVITE_COLLECTION,
    indexes: employeeInviteIndexes,
  },
  {
    name: BRANCH_COLLECTION,
    indexes: branchIndexes,
  },
  {
    name: OTP_COLLECTION,
    indexes: otpIndexes,
  },
  {
    name: REQUEST_COLLECTION,
    indexes: requestIndexes,
  },
  {
    name: CUSTOMER_SESSION_COLLECTION,
    indexes: customerSessionIndexes,
  },
  {
    name: EMPLOYEE_SESSION_COLLECTION,
    indexes: employeeSessionIndexes,
  },
  {
    name: ADMIN_USER_COLLECTION,
    indexes: adminUserIndexes,
  },
  {
    name: ROLE_COLLECTION,
    indexes: roleIndexes,
  },
] as const;
