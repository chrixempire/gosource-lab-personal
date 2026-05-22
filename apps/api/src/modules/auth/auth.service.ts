import { Logger, BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CustomerLoginDto,
  CustomerPasswordResetEmailDto,
  CustomerRefreshTokenDto,
  CustomerResetPasswordDto,
  CustomerResendOtpDto,
  CustomerLogoutDto,
  CustomerSetupAccountDto,
  CustomerSignupDto,
  CustomerVerifyPasswordOtpDto,
  CustomerVerifyOtpDto,
} from './auth.dto';
import { AuthRepository } from './auth.repository';
import type { Env } from '../../config/env.validation';
import { hashPassword, verifyPassword } from '../admin-auth/password.util';
import { signToken } from '../admin-auth/token.util';
import {
  compareRefreshToken,
  generateRefreshToken,
  generateRefreshTokenForSession,
  parseRefreshToken,
} from './refresh-token.util';
import type { SessionPrincipal } from './session-auth.guard';
import { hashOtpToken, verifyOtpToken } from './otp-token.util';

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly configService: ConfigService<Env, true>,
    private readonly repository: AuthRepository,
  ) {}

  private buildAccessToken(account: {
    id: string;
    email: string;
    businessId: string;
  }) {
    return signToken(
      {
        sub: account.id,
        email: account.email,
        user_type: 'customer',
        role: 'super_admin',
        businessId: account.businessId,
      },
      this.configService.get('AUTH_TOKEN_SECRET', { infer: true }),
      this.configService.get('AUTH_ACCESS_TOKEN_TTL_SECONDS', { infer: true }),
    );
  }

  private buildEmployeeAccessToken(employee: {
    id: string;
    email: string;
    businessId: string;
    branchId: string;
    role: 'manager' | 'employee';
  }) {
    return signToken(
      {
        sub: employee.id,
        email: employee.email,
        user_type: 'employee',
        role: employee.role,
        businessId: employee.businessId,
        branchId: employee.branchId,
      },
      this.configService.get('AUTH_TOKEN_SECRET', { infer: true }),
      this.configService.get('AUTH_ACCESS_TOKEN_TTL_SECONDS', { infer: true }),
    );
  }

  private async issueCustomerSession(account: {
    id: string;
    businessId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phoneNumber: string | null;
    status: string;
  }, options?: {
    message?: string;
    extraData?: Record<string, unknown>;
  }) {
    const refreshExpiresAt = new Date(
      Date.now() +
        this.configService.get('AUTH_REFRESH_TOKEN_TTL_SECONDS', { infer: true }) * 1000,
    );
    let refresh: ReturnType<typeof generateRefreshToken> | null = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      refresh = generateRefreshToken();

      try {
        await this.repository.createCustomerSession({
          sessionId: refresh.sessionId,
          customerAccountId: account.id,
          refreshTokenHash: refresh.tokenHash,
          expiresAt: refreshExpiresAt,
        });
        break;
      } catch (error) {
        const code = this.getDatabaseErrorCode(error);
        if (this.isDuplicateConstraintCode(code) && attempt === 0) {
          continue;
        }
        throw error;
      }
    }

    if (!refresh) {
      throw new BadRequestException('Unable to create a customer session right now');
    }

    return {
      message: options?.message ?? 'Customer login successful',
      user_type: 'customer' as const,
      data: {
        id: account.id,
        businessId: account.businessId,
        email: account.email,
        firstName: account.firstName,
        lastName: account.lastName,
        phoneNumber: account.phoneNumber,
        role: 'super_admin' as const,
        status: account.status,
        ...(options?.extraData ?? {}),
      },
      access_token: this.buildAccessToken(account),
      refresh_token: refresh.token,
    };
  }

  private async issueEmployeeSession(
    employee: {
      id: string;
      businessId: string;
      branchId: string;
      email: string;
      firstName: string;
      lastName: string;
      phoneNumber: string;
      position: string;
      role: 'manager' | 'employee';
      status: string;
    },
    options?: { message?: string },
  ) {
    const refreshExpiresAt = new Date(
      Date.now() +
        this.configService.get('AUTH_REFRESH_TOKEN_TTL_SECONDS', { infer: true }) * 1000,
    );
    let refresh: ReturnType<typeof generateRefreshToken> | null = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      refresh = generateRefreshToken();

      try {
        await this.repository.createEmployeeSession({
          sessionId: refresh.sessionId,
          employeeAccountId: employee.id,
          refreshTokenHash: refresh.tokenHash,
          expiresAt: refreshExpiresAt,
        });
        break;
      } catch (error) {
        const code = this.getDatabaseErrorCode(error);
        if (this.isDuplicateConstraintCode(code) && attempt === 0) {
          continue;
        }
        throw error;
      }
    }

    if (!refresh) {
      throw new BadRequestException('Unable to create an employee session right now');
    }

    return {
      message: options?.message ?? 'Sign in successful',
      user_type: 'employee' as const,
      data: {
        id: employee.id,
        businessId: employee.businessId,
        branchId: employee.branchId,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        phoneNumber: employee.phoneNumber,
        position: employee.position,
        role: employee.role,
        status: employee.status,
      },
      access_token: this.buildEmployeeAccessToken(employee),
      refresh_token: refresh.token,
    };
  }

  private logDevOtp(email: string, otpCode: string) {
    if (process.env.NODE_ENV === 'development') {
      this.logger.log(`Customer signup OTP for ${email}: ${otpCode}`);
      // Keep dev OTP visibility obvious during local onboarding tests.
      console.log(`[DEV OTP] ${email}: ${otpCode}`);
    }
  }

  private getOtpSecret() {
    return this.configService.get('AUTH_TOKEN_SECRET', { infer: true });
  }

  private getDatabaseErrorCode(error: unknown): string | undefined {
    if (typeof error !== 'object' || error === null) {
      return undefined;
    }

    const record = error as Record<string, unknown>;
    if (typeof record.code === 'string' || typeof record.code === 'number') {
      return String(record.code);
    }

    const cause = record.cause;
    if (typeof cause === 'object' && cause !== null) {
      const causeCode = (cause as Record<string, unknown>).code;
      if (typeof causeCode === 'string' || typeof causeCode === 'number') {
        return String(causeCode);
      }
    }

    return undefined;
  }

  private isDuplicateConstraintCode(code: string | undefined) {
    return code === '23505' || code === '11000';
  }

  async signup(data: CustomerSignupDto) {
    const email = data.email.trim().toLowerCase();
    const businessName = data.businessName.trim();

    if (!email || !businessName) {
      throw new BadRequestException('Business name and email are required');
    }

    const existingAccount = await this.repository.findCustomerByEmail(email);
    if (existingAccount) {
      if (existingAccount.status === 'active') {
        throw new BadRequestException('An account already exists for this email');
      }

      if (existingAccount.status === 'pending_verification') {
        const otpCode = generateOtp();
        await this.repository.updateOtpForCustomer(
          email,
          hashOtpToken(otpCode, this.getOtpSecret()),
        );
        this.logDevOtp(email, otpCode);

        return {
          message: 'Continue your registration',
          data: {
            email,
            businessId: existingAccount.businessId,
            onboardingStep: 2,
            status: 'pending_verification',
            resume: true,
          },
        };
      }

      if (existingAccount.status === 'pending_setup') {
        return {
          message: 'Continue your account setup',
          data: {
            email,
            businessId: existingAccount.businessId,
            onboardingStep: 3,
            status: 'pending_setup',
            resume: true,
          },
        };
      }

      throw new BadRequestException('This account is in an unsupported onboarding state');
    }

    const existingBusiness = await this.repository.findBusinessByName(businessName);
    if (existingBusiness) {
      throw new BadRequestException('Business name already exists');
    }

    const otpCode = generateOtp();
    let created;
    try {
      created = await this.repository.createPendingSignup({
        email,
        businessName,
        otpCodeHash: hashOtpToken(otpCode, this.getOtpSecret()),
      });
    } catch (error) {
      const code = this.getDatabaseErrorCode(error);
      if (this.isDuplicateConstraintCode(code)) {
        throw new BadRequestException('An account with this email or business name already exists');
      }
      throw error;
    }

    this.logDevOtp(email, otpCode);

    return {
      message: 'Business account created successfully',
      data: {
        email,
        businessId: created.businessId,
        onboardingStep: 2,
        status: 'pending_verification',
        resume: false,
      },
    };
  }

  async resendOtp(data: CustomerResendOtpDto) {
    const email = data.email.trim().toLowerCase();
    const account = await this.repository.findCustomerByEmail(email);

    if (!account) {
      throw new BadRequestException('No account was found for this email');
    }

    if (account.status === 'active') {
      throw new BadRequestException('This account has already been completed');
    }

    const otpCode = generateOtp();
    await this.repository.updateOtpForCustomer(
      email,
      hashOtpToken(otpCode, this.getOtpSecret()),
    );
    this.logDevOtp(email, otpCode);

    return {
      message: 'OTP sent successfully',
      data: {
        email,
        onboardingStep: account.verifiedAt ? 3 : 2,
      },
    };
  }

  async verifyOtp(data: CustomerVerifyOtpDto) {
    const email = data.email.trim().toLowerCase();
    const otp = data.otp.trim();
    const account = await this.repository.findCustomerByEmail(email);

    if (!account) {
      throw new BadRequestException('No account was found for this email');
    }

    if (!account.otpCode || !account.otpExpiresAt) {
      throw new BadRequestException('No active OTP was found for this email');
    }

    if (account.otpExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('This OTP has expired');
    }

    if (!verifyOtpToken(otp, account.otpCode, this.getOtpSecret())) {
      throw new BadRequestException('Invalid OTP code');
    }

    await this.repository.markCustomerVerified(email);

    return {
      message: 'Email verified successfully',
      data: {
        email,
        onboardingStep: 3,
      },
    };
  }

  async setupAccount(data: CustomerSetupAccountDto) {
    const email = data.email.trim().toLowerCase();
    const normalizedPhoneNumber = data.phoneNumber.replace(/\D/g, '');
    const account = await this.repository.findCustomerByEmail(email);

    if (!account) {
      throw new BadRequestException('No account was found for this email');
    }

    if (!account.verifiedAt) {
      throw new BadRequestException('Verify your email before setting up the account');
    }

    if (account.passwordHash || account.status === 'active') {
      throw new BadRequestException('This account has already been setup');
    }

    const existingPhoneOwner = await this.repository.findCustomerByNormalizedPhone(
      normalizedPhoneNumber,
    );

    if (existingPhoneOwner && existingPhoneOwner.id !== account.id) {
      throw new BadRequestException(
        'This phone number is already being used for another business account',
      );
    }

    let completedAccount;
    try {
      completedAccount = await this.repository.completeSetup(
        email,
        {
          ...data,
          phoneNumber: data.phoneNumber.trim(),
        },
        hashPassword(data.password.trim()),
      );
    } catch (error) {
      const code = this.getDatabaseErrorCode(error);
      if (this.isDuplicateConstraintCode(code)) {
        throw new BadRequestException(
          'This phone number is already being used for another business account',
        );
      }
      throw error;
    }

    if (!completedAccount) {
      throw new BadRequestException('Unable to complete account setup right now');
    }

    return this.issueCustomerSession(
      {
        id: completedAccount.id,
        businessId: completedAccount.businessId,
        email: completedAccount.email,
        firstName: completedAccount.firstName,
        lastName: completedAccount.lastName,
        phoneNumber: completedAccount.phoneNumber,
        status: 'active',
      },
      {
        message: 'Account setup completed successfully',
        extraData: {
          onboardingStep: 4,
        },
      },
    );
  }

  async login(data: CustomerLoginDto) {
    const email = data.email.trim().toLowerCase();
    const password = data.password.trim();
    const account = await this.repository.findCustomerByEmail(email);

    if (
      account &&
      account.passwordHash &&
      account.status === 'active' &&
      verifyPassword(password, account.passwordHash)
    ) {
      return this.issueCustomerSession({
        id: account.id,
        businessId: account.businessId,
        email: account.email,
        firstName: account.firstName,
        lastName: account.lastName,
        phoneNumber: account.phoneNumber,
        status: account.status,
      });
    }

    if (
      account &&
      account.passwordHash &&
      account.status === 'active' &&
      !verifyPassword(password, account.passwordHash)
    ) {
      throw new BadRequestException('Invalid email or password');
    }

    const employee = await this.repository.findEmployeeByEmail(email);

    if (!employee || !employee.passwordHash || employee.status !== 'active') {
      throw new BadRequestException('Invalid email or password');
    }

    if (!verifyPassword(password, employee.passwordHash)) {
      throw new BadRequestException('Invalid email or password');
    }

    return this.issueEmployeeSession({
      id: employee.id,
      businessId: employee.businessId,
      branchId: employee.branchId,
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      phoneNumber: employee.phoneNumber,
      position: employee.position,
      role: employee.role as 'manager' | 'employee',
      status: employee.status,
    });
  }

  async sendPasswordEmail(data: CustomerPasswordResetEmailDto) {
    const email = data.email.trim().toLowerCase();
    const account = await this.repository.findCustomerByEmail(email);

    if (account && account.passwordHash && account.status === 'active') {
      const otpCode = generateOtp();
      await this.repository.setPasswordResetOtp(
        email,
        hashOtpToken(otpCode, this.getOtpSecret()),
      );
      this.logDevOtp(email, otpCode);

      return {
        message: 'Password reset code sent successfully',
        data: {
          email,
          resetStep: 2,
        },
      };
    }

    const employee = await this.repository.findEmployeeByEmail(email);

    if (!employee || !employee.passwordHash || employee.status !== 'active') {
      throw new BadRequestException('No active account was found for this email');
    }

    const otpCode = generateOtp();
    await this.repository.setEmployeePasswordResetOtp(
      email,
      hashOtpToken(otpCode, this.getOtpSecret()),
    );
    this.logDevOtp(email, otpCode);

    return {
      message: 'Password reset code sent successfully',
      data: {
        email,
        resetStep: 2,
      },
    };
  }

  async verifyPasswordOtp(data: CustomerVerifyPasswordOtpDto) {
    const email = data.email.trim().toLowerCase();
    const token = data.token.trim();
    const account = await this.repository.findCustomerByEmail(email);

    if (account && account.passwordHash && account.status === 'active') {
      if (!account.otpCode || !account.otpExpiresAt) {
        throw new BadRequestException('No active reset code was found for this email');
      }

      if (account.otpExpiresAt.getTime() < Date.now()) {
        throw new BadRequestException('This reset code has expired');
      }

      if (!verifyOtpToken(token, account.otpCode, this.getOtpSecret())) {
        throw new BadRequestException('Invalid reset code');
      }

      return {
        message: 'Reset code verified successfully',
        data: {
          email,
          resetStep: 3,
        },
      };
    }

    const employee = await this.repository.findEmployeeByEmail(email);

    if (!employee || !employee.passwordHash || employee.status !== 'active') {
      throw new BadRequestException('No active account was found for this email');
    }

    if (!employee.otpCode || !employee.otpExpiresAt) {
      throw new BadRequestException('No active reset code was found for this email');
    }

    if (employee.otpExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('This reset code has expired');
    }

    if (!verifyOtpToken(token, employee.otpCode, this.getOtpSecret())) {
      throw new BadRequestException('Invalid reset code');
    }

    return {
      message: 'Reset code verified successfully',
      data: {
        email,
        resetStep: 3,
      },
    };
  }

  async resetPassword(data: CustomerResetPasswordDto) {
    const email = data.email.trim().toLowerCase();
    const token = data.token.trim();
    const account = await this.repository.findCustomerByEmail(email);

    if (account && account.passwordHash && account.status === 'active') {
      if (!account.otpCode || !account.otpExpiresAt) {
        throw new BadRequestException('No active reset code was found for this email');
      }

      if (account.otpExpiresAt.getTime() < Date.now()) {
        throw new BadRequestException('This reset code has expired');
      }

      if (!verifyOtpToken(token, account.otpCode, this.getOtpSecret())) {
        throw new BadRequestException('Invalid reset code');
      }

      await this.repository.updatePassword(
        email,
        data,
        hashPassword(data.newPassword.trim()),
      );

      return {
        message: 'Password reset completed successfully',
        data: {
          email,
          resetStep: 4,
        },
      };
    }

    const employee = await this.repository.findEmployeeByEmail(email);

    if (!employee || !employee.passwordHash || employee.status !== 'active') {
      throw new BadRequestException('No active account was found for this email');
    }

    if (!employee.otpCode || !employee.otpExpiresAt) {
      throw new BadRequestException('No active reset code was found for this email');
    }

    if (employee.otpExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('This reset code has expired');
    }

    if (!verifyOtpToken(token, employee.otpCode, this.getOtpSecret())) {
      throw new BadRequestException('Invalid reset code');
    }

    await this.repository.updateEmployeePasswordByEmail(
      email,
      hashPassword(data.newPassword.trim()),
    );

    return {
      message: 'Password reset completed successfully',
      data: {
        email,
        resetStep: 4,
      },
    };
  }

  async refresh(data: CustomerRefreshTokenDto) {
    const incomingToken = data.refreshToken.trim();
    let sessionId: string;

    try {
      ({ sessionId } = parseRefreshToken(incomingToken));
    } catch {
      throw new BadRequestException('Refresh token is no longer valid');
    }

    const customerSession = await this.repository.findCustomerSessionById(sessionId);

    if (
      customerSession &&
      !customerSession.revokedAt &&
      customerSession.expiresAt.getTime() >= Date.now() &&
      compareRefreshToken(incomingToken, customerSession.refreshTokenHash)
    ) {
      const account = await this.repository.findCustomerById(customerSession.customerAccountId);

      if (!account || account.status !== 'active') {
        throw new BadRequestException('No active customer account was found for this session');
      }

      const rotatedRefresh = generateRefreshTokenForSession(customerSession.id);
      const refreshExpiresAt = new Date(
        Date.now() +
          this.configService.get('AUTH_REFRESH_TOKEN_TTL_SECONDS', { infer: true }) * 1000,
      );

      await this.repository.rotateCustomerSession({
        sessionId: customerSession.id,
        refreshTokenHash: rotatedRefresh.tokenHash,
        expiresAt: refreshExpiresAt,
      });

      return {
        message: 'Session refreshed successfully',
        user_type: 'customer' as const,
        data: {
          id: account.id,
          businessId: account.businessId,
          email: account.email,
          firstName: account.firstName,
          lastName: account.lastName,
          phoneNumber: account.phoneNumber,
          role: 'super_admin' as const,
          status: account.status,
        },
        access_token: this.buildAccessToken(account),
        refresh_token: rotatedRefresh.token,
      };
    }

    const employeeSession = await this.repository.findEmployeeSessionById(sessionId);

    if (
      !employeeSession ||
      employeeSession.revokedAt ||
      employeeSession.expiresAt.getTime() < Date.now() ||
      !compareRefreshToken(incomingToken, employeeSession.refreshTokenHash)
    ) {
      throw new BadRequestException('Refresh token is no longer valid');
    }

    const employee = await this.repository.findEmployeeById(employeeSession.employeeAccountId);

    if (!employee || employee.status !== 'active') {
      throw new BadRequestException('No active employee account was found for this session');
    }

    const rotatedRefresh = generateRefreshTokenForSession(employeeSession.id);
    const refreshExpiresAt = new Date(
      Date.now() +
        this.configService.get('AUTH_REFRESH_TOKEN_TTL_SECONDS', { infer: true }) * 1000,
    );

    await this.repository.rotateEmployeeSession({
      sessionId: employeeSession.id,
      refreshTokenHash: rotatedRefresh.tokenHash,
      expiresAt: refreshExpiresAt,
    });

    return {
      message: 'Session refreshed successfully',
      user_type: 'employee' as const,
      data: {
        id: employee.id,
        businessId: employee.businessId,
        branchId: employee.branchId,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        phoneNumber: employee.phoneNumber,
        position: employee.position,
        role: employee.role,
        status: employee.status,
      },
        access_token: this.buildEmployeeAccessToken({
          ...employee,
          role: employee.role as 'manager' | 'employee',
        }),
        refresh_token: rotatedRefresh.token,
      };
  }

  async logout(data: CustomerLogoutDto) {
    const incomingToken = data.refreshToken.trim();

    try {
      const { sessionId } = parseRefreshToken(incomingToken);
      const customerSession = await this.repository.findCustomerSessionById(sessionId);

      if (customerSession && compareRefreshToken(incomingToken, customerSession.refreshTokenHash)) {
        await this.repository.revokeCustomerSession(sessionId);
        return {
          message: 'Logged out successfully',
        };
      }

      const employeeSession = await this.repository.findEmployeeSessionById(sessionId);

      if (employeeSession && compareRefreshToken(incomingToken, employeeSession.refreshTokenHash)) {
        await this.repository.revokeEmployeeSession(sessionId);
      }
    } catch {
      // Return a successful logout even if the client token is stale or malformed.
    }

    return {
      message: 'Logged out successfully',
    };
  }

  async me(principal: SessionPrincipal) {
      if (principal.user_type === 'customer') {
      const account = await this.repository.findCustomerById(principal.accountId);

      if (!account || account.status !== 'active') {
        throw new BadRequestException('No active customer account was found for this session');
      }

        return {
        user_type: 'customer' as const,
        message: 'Session fetched successfully',
        data: {
          id: account.id,
          businessId: account.businessId,
          email: account.email,
          firstName: account.firstName,
          lastName: account.lastName,
          phoneNumber: account.phoneNumber,
          role: 'super_admin' as const,
          status: account.status,
        },
      };
    }

    const employee = await this.repository.findEmployeeById(principal.employeeId);

    if (!employee || employee.status !== 'active') {
      throw new BadRequestException('No active employee account was found for this session');
    }

      return {
      user_type: 'employee' as const,
      message: 'Session fetched successfully',
      data: {
        id: employee.id,
        businessId: employee.businessId,
        branchId: employee.branchId,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        phoneNumber: employee.phoneNumber,
        position: employee.position,
        role: employee.role,
        status: employee.status,
      },
    };
  }
}
