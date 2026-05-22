import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { formatValidationError } from '../../utils/helpers';
import {
  validateAccountSetupRequest,
  validateLoginRequest,
  validateOtpRequest,
  validateResendOtpRequest,
  validateSignupRequest,
} from '../utils/auth.validation';
import { validationErrorResponse } from '../../utils/responses';

@Injectable()
export class AuthValidationMiddleware implements NestMiddleware {
  async validateVerificationRequest(schema: any, data: any) {
    return await schema.validateAsync(data);
  }

  async use(req: Request, res: Response, next: () => void) {
    try {
      const { body, url } = req;

      switch (url) {
        case '/v2/auth/login':
          await this.validateVerificationRequest(validateLoginRequest, body);
          break;
        case '/v2/auth/verify-otp':
          await this.validateVerificationRequest(validateOtpRequest, body);
          break;
        case '/v2/auth/setup-account':
          await this.validateVerificationRequest(
            validateAccountSetupRequest,
            body,
          );
          break;
        case '/v2/auth/signup':
          await this.validateVerificationRequest(validateSignupRequest, body);
          break;
        case '/v2/auth/resend-otp':
          await this.validateVerificationRequest(
            validateResendOtpRequest,
            body,
          );
          break;
        default:
          return validationErrorResponse(res, null);
      }
      next();
    } catch (error) {
      return validationErrorResponse(res, formatValidationError(error));
    }
  }
}
