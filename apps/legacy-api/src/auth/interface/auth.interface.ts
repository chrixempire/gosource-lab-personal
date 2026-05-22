export interface BusinessLogin {
  email: string;
  password: string;
}

export interface BusinessRegisterInterface {
  businessName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  password?: string;
  accountType?: string;
  onboardingStep?: number;
}

export interface NewAccountSetupInterface {
  firstName: string;
  lastName: string;
  password: string;
  phoneNumber: string;
  role?: string;
  email: string;
  onboardingStep?: number;
}

export interface OtpInterface {
  code: string;
  email: string;
}

export interface VerifyOtpInterface {
  otp: string;
  email: string;
}

export interface IPhoneNumber {
  newPhoneNumber: string;
  firstName?: string;
  lastName?: string;
}

export interface INewPassword {
  email: string;
  newPassword: string;
}

export interface IResetPassword {
  email: string;
}
