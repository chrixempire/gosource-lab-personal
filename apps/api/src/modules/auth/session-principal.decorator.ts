import { createParamDecorator, type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { SessionPrincipal } from './session-auth.guard';

type SessionRequest = {
  sessionPrincipal?: SessionPrincipal;
};

export const SessionPrincipalParam = createParamDecorator(
  (_data: unknown, context: ExecutionContext): SessionPrincipal => {
    const request = context.switchToHttp().getRequest<SessionRequest>();
    const principal = request.sessionPrincipal;

    if (!principal) {
      throw new UnauthorizedException('A valid session is required');
    }

    return principal;
  },
);
