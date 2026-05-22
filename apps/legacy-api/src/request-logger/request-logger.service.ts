import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RequestLog, RequestLogDocument } from './schema/request-log.schema';
import { Request, Response } from 'express';
import * as geoip from 'geoip-lite';
import { QueryRequestLogsDto } from './dto/query-request-logs.dto';

@Injectable()
export class RequestLoggerService {
  private readonly logger = new Logger(RequestLoggerService.name);

  constructor(
    @InjectModel(RequestLog.name)
    private requestLogModel: Model<RequestLogDocument>,
  ) {}

  /**
   * Log a request asynchronously without blocking the request flow
   */
  async logRequest(
    req: Request,
    res: Response,
    responseTime: number,
    responseBody?: any,
    error?: any,
  ): Promise<void> {
    try {
      const ip = this.extractIp(req);
      const geolocation = this.getGeolocation(ip);
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const deviceInfo = this.parseUserAgent(userAgent);

      // Extract user information if authenticated
      const userId = (req as any).user?.id || (req as any).user?._id;
      const businessId = (req as any).user?.businessId;

      // Calculate request and response sizes
      const requestSize = this.calculateRequestSize(req);
      const responseSize = responseBody
        ? Buffer.byteLength(JSON.stringify(responseBody))
        : 0;

      // Sanitize sensitive data from body and headers
      const sanitizedBody = this.sanitizeSensitiveData(req.body);
      const sanitizedHeaders = this.sanitizeHeaders(req.headers);

      // Prepare the log entry
      const logEntry = {
        method: req.method,
        url: req.originalUrl || req.url,
        path: req.path,
        headers: sanitizedHeaders,
        query: req.query,
        params: req.params,
        body: sanitizedBody,
        ip,
        userAgent,
        origin: req.headers.origin || '',
        referer: req.headers.referer || '',
        statusCode: res.statusCode,
        responseTime,
        responseBody: this.shouldLogResponseBody(req.path)
          ? this.sanitizeResponseBody(responseBody)
          : undefined,
        userId: userId?.toString(),
        businessId: businessId?.toString(),
        error: error?.message,
        errorDetails: error
          ? {
              name: error.name,
              stack: error.stack,
              code: error.code,
            }
          : undefined,
        requestSize,
        responseSize,
        geolocation,
        timezone: (req as any).user?.timeZone || 'Africa/Lagos',
        platform: deviceInfo.platform,
        browser: deviceInfo.browser,
        deviceType: deviceInfo.deviceType,
        isSuccess: res.statusCode >= 200 && res.statusCode < 400,
        endpoint: `${req.method} ${req.path}`,
        metadata: {
          protocol: req.protocol,
          hostname: req.hostname,
          xhr: req.xhr,
          secure: req.secure,
        },
      };

      // Save log asynchronously without blocking
      await this.requestLogModel.create(logEntry);
    } catch (error) {
      // Log the error but don't throw to avoid disrupting the request flow
      this.logger.error('Failed to log request', error.stack);
    }
  }

  /**
   * Query request logs with filtering and pagination
   */
  async queryLogs(queryDto: QueryRequestLogsDto): Promise<{
    data: RequestLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 50,
      method,
      path,
      statusCode,
      userId,
      businessId,
      ip,
      startDate,
      endDate,
      isSuccess,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryDto;

    const filter: any = {};

    if (method) filter.method = method;
    if (path) filter.path = { $regex: path, $options: 'i' };
    if (statusCode) filter.statusCode = statusCode;
    if (userId) filter.userId = userId;
    if (businessId) filter.businessId = businessId;
    if (ip) filter.ip = ip;
    if (isSuccess !== undefined) filter.isSuccess = isSuccess;

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const sort: any = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [data, total] = await Promise.all([
      this.requestLogModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.requestLogModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get request statistics
   */
  async getStatistics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    requestsByMethod: any[];
    requestsByStatusCode: any[];
    topEndpoints: any[];
    errorRate: number;
  }> {
    const filter: any = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startDate;
      if (endDate) filter.createdAt.$lte = endDate;
    }

    const [
      totalRequests,
      successfulRequests,
      failedRequests,
      avgResponseTime,
      requestsByMethod,
      requestsByStatusCode,
      topEndpoints,
    ] = await Promise.all([
      this.requestLogModel.countDocuments(filter),
      this.requestLogModel.countDocuments({ ...filter, isSuccess: true }),
      this.requestLogModel.countDocuments({ ...filter, isSuccess: false }),
      this.requestLogModel.aggregate([
        { $match: filter },
        { $group: { _id: null, avg: { $avg: '$responseTime' } } },
      ]),
      this.requestLogModel.aggregate([
        { $match: filter },
        { $group: { _id: '$method', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      this.requestLogModel.aggregate([
        { $match: filter },
        { $group: { _id: '$statusCode', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      this.requestLogModel.aggregate([
        { $match: filter },
        { $group: { _id: '$endpoint', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const errorRate =
      totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: avgResponseTime[0]?.avg?.toFixed(2) || 0,
      requestsByMethod,
      requestsByStatusCode,
      topEndpoints,
      errorRate: parseFloat(errorRate.toFixed(2)),
    };
  }

  /**
   * Delete old logs (for cleanup purposes)
   */
  async deleteOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.requestLogModel.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    this.logger.log(`Deleted ${result.deletedCount} old request logs`);
    return result.deletedCount;
  }

  /**
   * Extract client IP address
   */
  private extractIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress ||
      'Unknown'
    );
  }

  /**
   * Get geolocation from IP
   */
  private getGeolocation(ip: string): string {
    try {
      const geo = geoip.lookup(ip);
      if (geo) {
        return `${geo.city || 'Unknown'}, ${geo.country || 'Unknown'}`;
      }
    } catch (error) {
      this.logger.warn(`Failed to get geolocation for IP: ${ip}`);
    }
    return 'Unknown';
  }

  /**
   * Parse user agent for device information
   */
  private parseUserAgent(userAgent: string): {
    platform: string;
    browser: string;
    deviceType: string;
  } {
    const platform = this.detectPlatform(userAgent);
    const browser = this.detectBrowser(userAgent);
    const deviceType = this.detectDeviceType(userAgent);

    return { platform, browser, deviceType };
  }

  private detectPlatform(userAgent: string): string {
    if (/Windows/i.test(userAgent)) return 'Windows';
    if (/Mac OS X/i.test(userAgent)) return 'MacOS';
    if (/Linux/i.test(userAgent)) return 'Linux';
    if (/Android/i.test(userAgent)) return 'Android';
    if (/iOS|iPhone|iPad/i.test(userAgent)) return 'iOS';
    return 'Unknown';
  }

  private detectBrowser(userAgent: string): string {
    if (/Chrome/i.test(userAgent)) return 'Chrome';
    if (/Safari/i.test(userAgent)) return 'Safari';
    if (/Firefox/i.test(userAgent)) return 'Firefox';
    if (/Edge/i.test(userAgent)) return 'Edge';
    if (/Opera/i.test(userAgent)) return 'Opera';
    return 'Unknown';
  }

  private detectDeviceType(userAgent: string): string {
    if (/Mobile/i.test(userAgent)) return 'Mobile';
    if (/Tablet|iPad/i.test(userAgent)) return 'Tablet';
    return 'Desktop';
  }

  /**
   * Calculate request size
   */
  private calculateRequestSize(req: Request): number {
    try {
      const bodySize = req.body
        ? Buffer.byteLength(JSON.stringify(req.body))
        : 0;
      const headersSize = Buffer.byteLength(JSON.stringify(req.headers));
      return bodySize + headersSize;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Sanitize sensitive data from request body
   */
  private sanitizeSensitiveData(body: any): any {
    if (!body || typeof body !== 'object') return body;

    const sensitiveFields = [
      'password',
      'passwordConfirmation',
      'token',
      'accessToken',
      'refreshToken',
      'apiKey',
      'secret',
      'secretKey',
      'privateKey',
      'creditCard',
      'cvv',
      'pin',
      'otp',
    ];

    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  /**
   * Sanitize sensitive headers
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
    ];

    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  /**
   * Determine if response body should be logged
   */
  private shouldLogResponseBody(path: string): boolean {
    // Don't log response body for large responses or sensitive endpoints
    const excludePaths = ['/v1/file', '/v1/upload', '/v1/download'];
    return !excludePaths.some((p) => path.startsWith(p));
  }

  /**
   * Sanitize response body
   */
  private sanitizeResponseBody(responseBody: any): any {
    if (!responseBody) return null;

    // Limit response body size
    const responseStr = JSON.stringify(responseBody);
    if (responseStr.length > 10000) {
      return { message: 'Response body too large to log' };
    }

    return responseBody;
  }
}
