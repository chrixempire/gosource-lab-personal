import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Employee = createParamDecorator(
  // const injector = Inject(CACHE_MANAGER)
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
