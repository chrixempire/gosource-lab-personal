import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Sse,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { fromEvent, interval, map, merge, filter, type Observable } from 'rxjs';
import { AuthGuard } from '../auth/auth.guard';
import { BusinessCustomer } from '../business/schema/business.schema';
import { Employee } from '../employee/entities/employee.entity';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationService, NOTIFICATION_CREATED_EVENT } from './notification.service';
import type { NotificationStreamMessage } from './interface/notification.interface';

@Controller('notification')
@ApiTags('notification')
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class NotificationController {
  constructor(
    @InjectModel(BusinessCustomer.name)
    private businessCustomerModel: Model<BusinessCustomer>,
    @InjectModel(Employee.name)
    private employeeModel: Model<Employee>,
    private readonly notificationService: NotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List the current user’s notifications (bell feed)' })
  async list(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const data = await this.notificationService.list(String(req.user.id), {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      unreadOnly: unreadOnly === 'true',
    });
    return { status: true, message: 'Notifications fetched', data };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Unread notification count for the bell badge' })
  async unreadCount(@Req() req: any) {
    const count = await this.notificationService.unreadCount(
      String(req.user.id),
    );
    return { status: true, data: { unreadCount: count } };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all of the user’s notifications as read' })
  async markAllRead(@Req() req: any) {
    await this.notificationService.markAllRead(String(req.user.id));
    return { status: true, message: 'All notifications marked as read' };
  }

  // NB: static `bulk-*` routes must precede `:id/*` so ':id' doesn't capture them.
  @Patch('bulk-read')
  @ApiOperation({ summary: 'Mark a selected set of notifications as read' })
  async markManyRead(@Req() req: any, @Body('ids') ids: string[]) {
    await this.notificationService.markManyRead(String(req.user.id), ids ?? []);
    return { status: true, message: 'Notifications marked as read' };
  }

  @Patch('bulk-unread')
  @ApiOperation({ summary: 'Mark a selected set of notifications as unread' })
  async markManyUnread(@Req() req: any, @Body('ids') ids: string[]) {
    await this.notificationService.markManyUnread(
      String(req.user.id),
      ids ?? [],
    );
    return { status: true, message: 'Notifications marked as unread' };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  async markRead(@Req() req: any, @Param('id') id: string) {
    await this.notificationService.markRead(String(req.user.id), id);
    return { status: true, message: 'Notification marked as read' };
  }

  @Patch(':id/unread')
  @ApiOperation({ summary: 'Mark a single notification as unread' })
  async markUnread(@Req() req: any, @Param('id') id: string) {
    await this.notificationService.markUnread(String(req.user.id), id);
    return { status: true, message: 'Notification marked as unread' };
  }

  // NB: the static `read`/`bulk` routes must precede `:id` so ':id' doesn't capture them.
  @Delete('read')
  @ApiOperation({ summary: 'Delete all of the user’s read notifications' })
  async removeAllRead(@Req() req: any) {
    await this.notificationService.removeAllRead(String(req.user.id));
    return { status: true, message: 'Read notifications cleared' };
  }

  @Delete('bulk')
  @ApiOperation({ summary: 'Delete a selected set of notifications' })
  async removeMany(@Req() req: any, @Body('ids') ids: string[]) {
    await this.notificationService.removeMany(String(req.user.id), ids ?? []);
    return { status: true, message: 'Notifications deleted' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a single notification' })
  async remove(@Req() req: any, @Param('id') id: string) {
    await this.notificationService.remove(String(req.user.id), id);
    return { status: true, message: 'Notification deleted' };
  }

  /**
   * Live notification stream (SSE). The customer-web Nitro server proxies this
   * with the user's Bearer token; the browser connects same-origin via
   * EventSource. Only frames addressed to the signed-in user are emitted.
   */
  @Sse('stream')
  @ApiOperation({ summary: 'Server-sent notification stream for the bell' })
  stream(@Req() req: any): Observable<{ data: NotificationStreamMessage }> {
    const userId = String(req.user.id);

    const notifications$ = fromEvent(
      this.eventEmitter,
      NOTIFICATION_CREATED_EVENT,
    ).pipe(
      filter(
        (payload) => (payload as { recipient?: string })?.recipient === userId,
      ),
      map((payload) => ({
        data: {
          type: 'notification' as const,
          notification: (payload as { notification?: Record<string, unknown> })
            ?.notification,
        },
      })),
    );

    const heartbeat$ = interval(25000).pipe(
      map(() => ({ data: { type: 'ping' as const } })),
    );

    return merge(notifications$, heartbeat$);
  }

  @Patch('token')
  @ApiOperation({ summary: 'Update notification token' })
  async updateToken(@Req() req: any, @Body('token') token: string) {
    if (!token) {
      throw new BadRequestException('Notification token is required');
    }

    const user = req.user;

    if (user.user_type === 'BUSINESS') {
      await this.businessCustomerModel.findByIdAndUpdate(user.id, {
        $addToSet: { notificationTokens: token },
      });
    } else if (user.role && user.businessId) {
      await this.employeeModel.findByIdAndUpdate(user.id, {
        notificationToken: token,
      });
    } else {
      const isEmployee = await this.employeeModel.exists({ _id: user.id });
      if (isEmployee) {
        await this.employeeModel.findByIdAndUpdate(user.id, {
          notificationToken: token,
        });
      } else {
        await this.businessCustomerModel.findByIdAndUpdate(user.id, {
          $addToSet: { notificationTokens: token },
        });
      }
    }

    return {
      status: true,
      message: 'Notification token updated successfully',
    };
  }
}
