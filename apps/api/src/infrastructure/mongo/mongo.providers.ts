import { ConfigService } from '@nestjs/config';
import type { Provider } from '@nestjs/common';
import type { Env } from '../../config/env.validation';
import {
  MONGO_COLLECTION_REGISTRY,
  MONGO_CONFIG,
  type MongoCollectionRegistryEntry,
} from './mongo.constants';
import { mongoCollectionRegistry } from './schemas';

export type MongoConfig = {
  enabled: boolean;
  uri: string | null;
  dbName: string | null;
};

export const mongoProviders: Provider[] = [
  {
    provide: MONGO_CONFIG,
    inject: [ConfigService],
    useFactory: (configService: ConfigService<Env, true>): MongoConfig => ({
      enabled: Boolean(configService.get('MONGODB_ENABLED', { infer: true })),
      uri: configService.get('MONGODB_URI', { infer: true }) ?? null,
      dbName: configService.get('MONGODB_DB_NAME', { infer: true }) ?? null,
    }),
  },
  {
    provide: MONGO_COLLECTION_REGISTRY,
    useValue: mongoCollectionRegistry satisfies readonly MongoCollectionRegistryEntry[],
  },
] satisfies Provider[];
