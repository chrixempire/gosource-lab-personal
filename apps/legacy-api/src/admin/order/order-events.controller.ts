import { Controller, Sse, UseGuards } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { fromEvent, interval, map, merge, type Observable } from 'rxjs';
import { AdminAuth } from '../auth/decorator/admin-auth.decorator';
import { AdminRoles } from '../auth/enum/admin.enum';
import { Roles } from '../auth/decorator/role.decorator';
import { RequiredPermission } from '../role/enum/required-permission';
import { AdminRolesGuard } from '../auth/guard/adminRole.guard';

type SseMessage = { data: Record<string, unknown> };

/**
 * Streams order events to authenticated admin dashboards over Server-Sent
 * Events. The admin-web Nitro server proxies this with the admin Bearer token;
 * the browser connects same-origin via EventSource.
 */
@Controller('admin/order-events')
@AdminAuth()
export class OrderEventsController {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  @Sse()
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_ORDER)
  @UseGuards(AdminRolesGuard)
  stream(): Observable<SseMessage> {
    const orders$ = fromEvent(this.eventEmitter, 'order.created').pipe(
      map((payload) => ({
        data: {
          type: 'order.created',
          ...((payload as Record<string, unknown>) ?? {}),
        },
      })),
    );

    // Heartbeat so idle connections aren't dropped by proxies / the browser.
    const heartbeat$ = interval(25000).pipe(
      map(() => ({ data: { type: 'ping' } }) as SseMessage),
    );

    return merge(orders$, heartbeat$);
  }
}
