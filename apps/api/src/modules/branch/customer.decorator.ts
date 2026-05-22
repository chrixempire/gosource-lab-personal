import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export const Customer = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<{
      customer?: {
        accountId: string;
        businessId: string;
        email: string;
        role: string;
      };
    }>();

    return request.customer;
  },
);
