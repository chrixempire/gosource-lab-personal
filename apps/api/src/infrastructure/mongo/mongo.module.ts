import { Global, Module } from '@nestjs/common';
import { mongoProviders } from './mongo.providers';
import { MONGO_COLLECTION_REGISTRY, MONGO_CONFIG } from './mongo.constants';
import { MongoService } from './mongo.service';

@Global()
@Module({
  providers: [MongoService, ...mongoProviders],
  exports: [MongoService, MONGO_CONFIG, MONGO_COLLECTION_REGISTRY],
})
export class MongoModule {}
