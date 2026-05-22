import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RateLimit } from '../../common/rate-limit.decorator';
import { RateLimitGuard } from '../../common/rate-limit.guard';
import { SessionAuthGuard, type SessionPrincipal } from '../auth/session-auth.guard';
import { SessionPrincipalParam } from '../auth/session-principal.decorator';
import {
  CreateRequestDto,
  ListRequestsQueryDto,
  RejectRequestDto,
  UpdateRequestPaymentDto,
} from './request.dto';
import { RequestService } from './request.service';

@Controller('request')
@UseGuards(RateLimitGuard)
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @UseGuards(SessionAuthGuard)
  @Post()
  @RateLimit({ limit: 10, windowMs: 60_000 })
  createRequest(
    @Body() data: CreateRequestDto,
    @SessionPrincipalParam() principal: SessionPrincipal,
  ) {
    return this.requestService.createRequest(data, principal);
  }

  @UseGuards(SessionAuthGuard)
  @Get()
  listRequests(
    @Query() query: ListRequestsQueryDto,
    @SessionPrincipalParam() principal: SessionPrincipal,
  ) {
    return this.requestService.listRequests(query, principal);
  }

  @UseGuards(SessionAuthGuard)
  @Get(':requestId')
  getRequestById(
    @Param('requestId') requestId: string,
    @SessionPrincipalParam() principal: SessionPrincipal,
  ) {
    return this.requestService.getRequestById(requestId, principal);
  }

  @UseGuards(SessionAuthGuard)
  @Patch(':requestId/approve')
  @RateLimit({ limit: 10, windowMs: 60_000 })
  approveRequest(
    @Param('requestId') requestId: string,
    @Body() data: UpdateRequestPaymentDto,
    @SessionPrincipalParam() principal: SessionPrincipal,
  ) {
    return this.requestService.approveRequest(requestId, data, principal);
  }

  @UseGuards(SessionAuthGuard)
  @Patch(':requestId/reject')
  @RateLimit({ limit: 10, windowMs: 60_000 })
  rejectRequest(
    @Param('requestId') requestId: string,
    @Body() data: RejectRequestDto,
    @SessionPrincipalParam() principal: SessionPrincipal,
  ) {
    return this.requestService.rejectRequest(requestId, data, principal);
  }

  @UseGuards(SessionAuthGuard)
  @Patch(':requestId/cancel')
  @RateLimit({ limit: 10, windowMs: 60_000 })
  cancelRequest(
    @Param('requestId') requestId: string,
    @SessionPrincipalParam() principal: SessionPrincipal,
  ) {
    return this.requestService.cancelRequest(requestId, principal);
  }
}
