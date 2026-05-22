import { CreditStatus } from '../enum/credit.enum';

export const ACTIVE_STATUSES = {
  $nin: [CreditStatus.REJECTED, CreditStatus.CANCELLED, CreditStatus.COMPLETED],
};

export const REAPPLICATION_COOLDOWN_DAYS = 60;

export const ADMIN_EMAILS = [
  'lanrebello@ipc-africa.com',
  'vnneji@ipc-africa.com',
  'hanifah@ipc-africa.com',
  'quadrii@ipc-africa.com',
  'jennifer@ipc-africa.com',
];
