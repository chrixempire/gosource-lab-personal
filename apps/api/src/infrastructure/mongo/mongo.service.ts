import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Db, MongoClient } from 'mongodb';
import type { Env } from '../../config/env.validation';
import {
  MONGO_COLLECTION_REGISTRY,
  type MongoCollectionRegistryEntry,
} from './mongo.constants';

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  private client: MongoClient | null = null;
  private database: Db | null = null;

  constructor(
    private readonly configService: ConfigService<Env, true>,
    @Inject(MONGO_COLLECTION_REGISTRY)
    private readonly collectionRegistry: readonly MongoCollectionRegistryEntry[],
  ) {}

  get enabled() {
    return Boolean(this.configService.get('MONGODB_ENABLED', { infer: true }));
  }

  get db(): Db | null {
    return this.database;
  }

  get mongoClient(): MongoClient | null {
    return this.client;
  }

  private async ensureIndexes() {
    if (!this.database) {
      return;
    }

    for (const entry of this.collectionRegistry) {
      if (entry.indexes.length === 0) {
        continue;
      }

      await this.database.collection(entry.name).createIndexes(
        entry.indexes.map((index) => ({
          key: index.key,
          ...index.options,
        })),
      );
    }
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    const uri = this.configService.get('MONGODB_URI', { infer: true });
    const dbName = this.configService.get('MONGODB_DB_NAME', { infer: true });

    if (!uri || !dbName) {
      throw new Error('MongoDB is enabled but connection settings are incomplete');
    }

    this.client = new MongoClient(uri);
    await this.client.connect();
    this.database = this.client.db(dbName);
    await this.database.command({ ping: 1 });
    await this.ensureIndexes();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.database = null;
    }
  }
}
