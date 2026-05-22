import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_META_KEY, type RateLimitOptions } from './rate-limit.decorator';

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, RateLimitBucket>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions | undefined>(
      RATE_LIMIT_META_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      ip?: string;
      headers?: Record<string, string | string[] | undefined>;
      route?: { path?: string };
    }>();

    const forwardedFor = request.headers?.['x-forwarded-for'];
    const ip =
      (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(',')[0]?.trim() ||
      request.ip ||
      'unknown';
    const routeKey = request.route?.path ?? context.getHandler().name;
    const bucketKey = `${routeKey}:${ip}`;
    const now = Date.now();
    const current = this.buckets.get(bucketKey);

    if (!current || current.resetAt <= now) {
      this.buckets.set(bucketKey, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      return true;
    }

    if (current.count >= options.limit) {
      throw new HttpException(
        'Too many requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    current.count += 1;
    this.buckets.set(bucketKey, current);
    return true;
  }
}
