import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { MongoService } from '../../infrastructure/mongo/mongo.service';

@Controller()
export class HealthController {
  constructor(private readonly mongoService: MongoService) {}

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'api',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health/ready')
  async ready() {
    if (this.mongoService.enabled) {
      const database = this.mongoService.db;

      if (!database) {
        throw new ServiceUnavailableException('MongoDB connection is not available');
      }

      await database.command({ ping: 1 });
    }

    return {
      status: 'ok',
      service: 'api',
      database: this.mongoService.enabled ? 'up' : 'disabled',
      timestamp: new Date().toISOString(),
    };
  }
}
