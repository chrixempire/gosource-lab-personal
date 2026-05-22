export const MONGO_CLIENT = Symbol('MONGO_CLIENT');
export const MONGO_DB = Symbol('MONGO_DB');
export const MONGO_CONFIG = Symbol('MONGO_CONFIG');
export const MONGO_COLLECTION_REGISTRY = Symbol('MONGO_COLLECTION_REGISTRY');

export type MongoCollectionIndexDefinition = {
  key: Record<string, 1 | -1>;
  options?: Record<string, unknown>;
};

export type MongoCollectionRegistryEntry = {
  name: string;
  indexes: readonly MongoCollectionIndexDefinition[];
};
