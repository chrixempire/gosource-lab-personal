import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import redisConnection from '../redisConnection';
const redis = redisConnection.getClient();

@Injectable()
export class RedisLockService {
  private readonly redis: Redis;
  private readonly logger = new Logger(RedisLockService.name);
  private readonly LOCK_TTL = 60;

  constructor() {
    // this.redis = new Redis(process.env.REDIS_URL);
    this.redis = redis;
  }

  async acquireLock(
    lockKey: string,
    ttl: number = this.LOCK_TTL,
  ): Promise<boolean> {
    try {
      const result = await this.redis.set(lockKey, 'LOCKED', 'EX', ttl, 'NX');
      return result === 'OK';
    } catch (error: any) {
      this.logger.error(`Lock acquisition failed: ${error.message}`);
      return false;
    }
  }

  async releaseLock(lockKey: string): Promise<void> {
    await this.redis.del(lockKey);
  }

  async withLock<T>(
    lockKey: string,
    ttl: number,
    fn: () => Promise<T>,
  ): Promise<T | undefined> {
    const hasLock = await this.acquireLock(lockKey, ttl);
    if (!hasLock) {
      this.logger.warn(`Lock already held for key: ${lockKey}`);
      return;
    }

    try {
      return await fn();
    } finally {
      if (hasLock) {
        await this.releaseLock(lockKey);
      }
    }
  }
}
