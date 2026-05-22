export const OTP_COLLECTION = 'otps';

export type OtpPurpose =
  | 'customer_signup'
  | 'customer_password_reset'
  | 'employee_password_reset';

export interface OtpDocument {
  _id: string;
  email: string;
  codeHash: string;
  purpose: OtpPurpose;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const otpIndexes = [
  { key: { email: 1 }, options: { unique: true } },
  { key: { expiresAt: 1 }, options: { expireAfterSeconds: 0 } },
] as const;
