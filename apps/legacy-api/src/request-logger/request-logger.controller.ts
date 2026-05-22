import {
  Controller,
  Get,
  Query,
  Delete,
  UseGuards,
  HttpStatus,
  Param,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { RequestLoggerService } from './request-logger.service';
import { QueryRequestLogsDto } from './dto/query-request-logs.dto';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Request Logs')
@Controller('request-logs')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class RequestLoggerController {
  constructor(private readonly requestLoggerService: RequestLoggerService) {}

  private checkSuperAdmin(req: any): void {
    if (req.user?.role !== 'Super Admin') {
      throw new ForbiddenException('Only super admins can access request logs');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get request logs with filtering and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Request logs retrieved successfully',
  })
  async getLogs(@Query() queryDto: QueryRequestLogsDto, @Req() req: any) {
    this.checkSuperAdmin(req);
    return this.requestLoggerService.queryLogs(queryDto);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get request statistics' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
  })
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Req() req?: any,
  ) {
    this.checkSuperAdmin(req);
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.requestLoggerService.getStatistics(start, end);
  }

  @Delete('cleanup/:days')
  @ApiOperation({ summary: 'Delete logs older than specified days' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Old logs deleted successfully',
  })
  async cleanupOldLogs(@Param('days') days: string, @Req() req: any) {
    this.checkSuperAdmin(req);
    const daysToKeep = parseInt(days, 10);
    const deletedCount =
      await this.requestLoggerService.deleteOldLogs(daysToKeep);

    return {
      success: true,
      message: `Deleted ${deletedCount} old request logs`,
      deletedCount,
    };
  }
}
