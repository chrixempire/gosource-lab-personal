import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export const EmployeeInvite = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<{
      employeeInvite?: {
        invitationId: string;
        email: string;
        businessId: string;
        role: string;
      };
    }>();

    return request.employeeInvite;
  },
);
