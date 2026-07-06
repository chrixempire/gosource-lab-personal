import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ActivityService } from './activity.service';
import { ACTIVITY_LOG_ACTION_TYPE } from './interface/activityLog.interface';
import { SKIP_ACTIVITY_LOG } from './skip-activity-log.decorator';
import { adminInitiator } from '../utils/activity-initiator.util';

const MUTATION_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * Auto-logs every successful admin mutation (POST/PATCH/PUT/DELETE) as a
 * safety net, so any endpoint that doesn't write its own richer log is still
 * captured. Endpoints marked @SkipActivityLog() (e.g. inventory, auth) opt out.
 * Reads (GET) are never logged. Fully guarded — logging never affects the
 * response.
 */
@Injectable()
export class AdminActivityInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly activity: ActivityService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    let req: any;
    try {
      req = context.switchToHttp().getRequest();
    } catch {
      return next.handle();
    }

    const method = String(req?.method ?? '').toUpperCase();
    const url = String(req?.originalUrl ?? req?.url ?? '');
    const isAdmin = url.includes('/admin/');
    const isAuthRoute = url.includes('/admin/auth'); // logged explicitly elsewhere
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_ACTIVITY_LOG, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!MUTATION_METHODS.has(method) || !isAdmin || isAuthRoute || skip) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        // Only log on success; errors are not actions taken.
        next: () => void this.log(req, method, url),
      }),
    );
  }

  private async log(req: any, method: string, url: string): Promise<void> {
    try {
      const initiator = adminInitiator(req?.user);
      const payload = this.sanitizeBody(req?.body);
      await this.activity.record({
        ...initiator,
        action: this.resolveAction(method, url),
        module: this.resolveModule(url),
        objectId: this.resolveObjectId(req),
        ipAddress: this.resolveIp(req),
        description: this.describe(method, url, req, payload),
        metadata: { method, path: this.cleanPath(url), submitted: payload },
      });
    } catch {
      // never throw from logging
    }
  }

  // Keys we never want to persist in the activity log.
  private static readonly SENSITIVE_KEYS =
    /password|token|secret|otp|pin|cvv|card|bvn|authorization|apikey|api_key/i;

  /**
   * Shallow copy of the submitted body for the log: redacts sensitive keys,
   * truncates long strings, and summarises objects/arrays so the metadata
   * stays small and safe. Returns null for empty bodies.
   */
  private sanitizeBody(body: unknown): Record<string, unknown> | null {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return null;
    }
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      if (AdminActivityInterceptor.SENSITIVE_KEYS.test(key)) {
        out[key] = '[redacted]';
      } else if (typeof value === 'string') {
        out[key] = value.length > 120 ? `${value.slice(0, 120)}…` : value;
      } else if (value === null || ['number', 'boolean'].includes(typeof value)) {
        out[key] = value;
      } else if (Array.isArray(value)) {
        out[key] = `[${value.length} item${value.length === 1 ? '' : 's'}]`;
      } else if (typeof value === 'object') {
        out[key] = '[object]';
      }
    }
    return Object.keys(out).length ? out : null;
  }

  private resolveAction(method: string, url: string): ACTIVITY_LOG_ACTION_TYPE {
    const u = url.toLowerCase();
    if (u.includes('/activate')) return ACTIVITY_LOG_ACTION_TYPE.ACTIVATE;
    if (u.includes('/deactivate')) return ACTIVITY_LOG_ACTION_TYPE.DEACTIVATE;
    if (u.includes('/in-stock') || u.includes('/add-stock'))
      return ACTIVITY_LOG_ACTION_TYPE.STOCK_IN;
    if (
      u.includes('/out-stock') ||
      u.includes('/out-of-stock') ||
      u.includes('/deduct-stock')
    )
      return ACTIVITY_LOG_ACTION_TYPE.STOCK_OUT;
    if (method === 'POST') return ACTIVITY_LOG_ACTION_TYPE.CREATE;
    if (method === 'DELETE') return ACTIVITY_LOG_ACTION_TYPE.DELETE;
    return ACTIVITY_LOG_ACTION_TYPE.UPDATE;
  }

  /** First path segment after "admin", Title-cased (e.g. "product" -> "Product"). */
  private resolveModule(url: string): string {
    const path = this.cleanPath(url);
    const parts = path.split('/').filter(Boolean);
    const idx = parts.indexOf('admin');
    const segment = idx >= 0 ? parts[idx + 1] : parts[0];
    if (!segment) return 'Admin';
    return segment
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');
  }

  private resolveObjectId(req: any): string | null {
    const id = req?.params?.id ?? req?.params?.orderId ?? req?.params?.productId;
    return id ? String(id) : null;
  }

  private resolveIp(req: any): string | null {
    const forwarded = req?.headers?.['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) {
      return forwarded.split(',')[0].trim();
    }
    return req?.ip ?? req?.socket?.remoteAddress ?? null;
  }

  private describe(
    method: string,
    url: string,
    req: any,
    payload: Record<string, unknown> | null,
  ): string {
    const action = this.resolveAction(method, url);
    const module = this.resolveModule(url);
    const id = this.resolveObjectId(req);

    // Prefer a recognizable label from the submitted body, else the record id.
    const label =
      this.firstString(payload, [
        'name',
        'title',
        'businessName',
        'reference',
        'email',
        'status',
        'subject',
      ]) ?? (id ? `(${id})` : '');

    return label ? `${action} ${module} ${label}`.trim() : `${action} ${module}`;
  }

  private firstString(
    payload: Record<string, unknown> | null,
    keys: string[],
  ): string | null {
    if (!payload) return null;
    for (const key of keys) {
      const value = payload[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return null;
  }

  private cleanPath(url: string): string {
    return url.split('?')[0];
  }
}
