import { Logger } from '@nestjs/common';
import Redis from 'ioredis';

class RedisConnection {
  private static instance: RedisConnection;
  private client: Redis | null;

  constructor() {
    if (RedisConnection.instance) {
      return RedisConnection.instance;
    }

    this.client = null;
    RedisConnection.instance = this;
  }

  connect(): Redis {
    if (this.client) {
      return this.client;
    }

    this.client = new Redis(process.env.REDIS_URL!, {
      enableReadyCheck: true, // Wait for full readiness before emitting 'ready'
      reconnectOnError: (err) => {
        const message = err.message;
        if (
          message.includes('READONLY') || // During failover
          message.includes('ECONNRESET') ||
          message.includes('ETIMEDOUT') ||
          message.includes('EAI_AGAIN')
        ) {
          Logger.warn(
            '[Redis] Will attempt to reconnect after error:',
            message,
          );
          return true;
        }
        return false;
      },
      retryStrategy: (times) => {
        const delay = Math.min(times * 100, 2000); // Exponential backoff, max 2s
        Logger.warn(`[Redis] Retry attempt #${times}, delay: ${delay}ms`);
        return delay;
      },
    });

    this.client.on('error', (error: Error) => {
      Logger.error('[Redis] Connection Error:', error.message);
    });

    this.client.on('connect', () => {
      Logger.log('[Redis] Connected successfully');
    });

    this.client.on('ready', () => {
      Logger.log('[Redis] Client is ready');
    });

    this.client.on('close', () => {
      Logger.warn('[Redis] Connection closed');
      this.client = null;
    });

    this.client.on('reconnecting', () => {
      Logger.log('[Redis] Reconnecting...');
    });

    return this.client;
  }

  getClient(): Redis {
    if (!this.client) {
      return this.connect();
    }
    return this.client;
  }
}

const redisConnection = new RedisConnection();
export default redisConnection;
