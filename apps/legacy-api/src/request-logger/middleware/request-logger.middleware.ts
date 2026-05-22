import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestLoggerService } from '../request-logger.service';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggerMiddleware.name);

  constructor(private readonly requestLoggerService: RequestLoggerService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    // Capture the original response methods
    const originalSend = res.send;
    const originalJson = res.json;
    let responseBody: any;

    // Override res.send to capture response body
    res.send = function (body: any): Response {
      responseBody = body;
      res.send = originalSend;
      return res.send(body);
    };

    // Override res.json to capture response body
    res.json = function (body: any): Response {
      responseBody = body;
      res.json = originalJson;
      return res.json(body);
    };

    // Listen for the response finish event
    res.on('finish', async () => {
      const responseTime = Date.now() - startTime;

      // Parse response body if it's a string
      try {
        if (typeof responseBody === 'string') {
          responseBody = JSON.parse(responseBody);
        }
      } catch (error) {
        // If parsing fails, keep the original response body
      }

      // Log the request asynchronously without blocking
      setImmediate(() => {
        this.requestLoggerService
          .logRequest(req, res, responseTime, responseBody, null)
          .catch((error) => {
            this.logger.error('Failed to log request', error.stack);
          });
      });
    });

    // Handle errors
    const originalNextFunction = next;
    next = function (error?: any) {
      if (error) {
        const responseTime = Date.now() - startTime;

        // Log the error request asynchronously
        setImmediate(() => {
          this.requestLoggerService
            .logRequest(req, res, responseTime, responseBody, error)
            .catch((logError) => {
              this.logger.error('Failed to log error request', logError.stack);
            });
        });
      }
      return originalNextFunction(error);
    };

    next();
  }
}
