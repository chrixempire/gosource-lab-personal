export type Env = {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  MONGODB_URI?: string;
  MONGODB_DB_NAME?: string;
  MONGODB_ENABLED?: boolean;
  AUTH_TOKEN_SECRET: string;
  AUTH_ACCESS_TOKEN_TTL_SECONDS: number;
  AUTH_REFRESH_TOKEN_TTL_SECONDS: number;
  FRONTEND_APP_ORIGINS?: string;
  DEV_ADMIN_EMAIL?: string;
  DEV_ADMIN_PASSWORD?: string;
  DEV_ADMIN_SEED_ENABLED?: boolean;
};

export function validateEnv(config: Record<string, unknown>): Env {
  const rawNodeEnv = config.NODE_ENV;
  const rawPort = config.PORT;
  const rawMongoDbUri = config.MONGODB_URI;
  const rawMongoDbName = config.MONGODB_DB_NAME;
  const rawMongoDbEnabled = config.MONGODB_ENABLED;
  const rawAuthTokenSecret = config.AUTH_TOKEN_SECRET;
  const rawAccessTokenTtl = config.AUTH_ACCESS_TOKEN_TTL_SECONDS;
  const rawRefreshTokenTtl = config.AUTH_REFRESH_TOKEN_TTL_SECONDS;
  const rawFrontendAppOrigins = config.FRONTEND_APP_ORIGINS;
  const rawDevAdminEmail = config.DEV_ADMIN_EMAIL;
  const rawDevAdminPassword = config.DEV_ADMIN_PASSWORD;
  const rawDevAdminSeedEnabled = config.DEV_ADMIN_SEED_ENABLED;

  const errors: string[] = [];

  let NODE_ENV: Env['NODE_ENV'] = 'development';

  if (rawNodeEnv === undefined || rawNodeEnv === null || rawNodeEnv === '') {
    NODE_ENV = 'development';
  } else if (
    rawNodeEnv === 'development' ||
    rawNodeEnv === 'test' ||
    rawNodeEnv === 'production'
  ) {
    NODE_ENV = rawNodeEnv;
  } else {
    errors.push("NODE_ENV must be one of 'development', 'test', or 'production'");
  }

  const PORT = Number(rawPort ?? 3001);
  if (!Number.isInteger(PORT) || PORT <= 0) {
    errors.push('PORT must be a positive integer');
  }

  const MONGODB_URI =
    typeof rawMongoDbUri === 'string' && rawMongoDbUri.trim().length > 0
      ? rawMongoDbUri.trim()
      : undefined;

  const MONGODB_DB_NAME =
    typeof rawMongoDbName === 'string' && rawMongoDbName.trim().length > 0
      ? rawMongoDbName.trim()
      : undefined;

  const MONGODB_ENABLED =
    rawMongoDbEnabled === true ||
    rawMongoDbEnabled === 'true' ||
    rawMongoDbEnabled === '1';

  if (MONGODB_ENABLED && !MONGODB_URI) {
    errors.push('MONGODB_URI is required when MONGODB_ENABLED is enabled');
  }

  if (MONGODB_ENABLED && !MONGODB_DB_NAME) {
    errors.push('MONGODB_DB_NAME is required when MONGODB_ENABLED is enabled');
  }

  const AUTH_TOKEN_SECRET =
    typeof rawAuthTokenSecret === 'string' && rawAuthTokenSecret.trim().length > 0
      ? rawAuthTokenSecret
      : NODE_ENV === 'development'
        ? 'gosource-dev-secret'
        : '';

  if (!AUTH_TOKEN_SECRET) {
    errors.push('AUTH_TOKEN_SECRET is required');
  }

  if (NODE_ENV !== 'development') {
    if (AUTH_TOKEN_SECRET === 'gosource-dev-secret') {
      errors.push('AUTH_TOKEN_SECRET must not use the development default outside development');
    }

    if (AUTH_TOKEN_SECRET.length < 32) {
      errors.push('AUTH_TOKEN_SECRET must be at least 32 characters outside development');
    }
  }

  const AUTH_ACCESS_TOKEN_TTL_SECONDS = Number(rawAccessTokenTtl ?? 60 * 15);
  if (!Number.isInteger(AUTH_ACCESS_TOKEN_TTL_SECONDS) || AUTH_ACCESS_TOKEN_TTL_SECONDS <= 0) {
    errors.push('AUTH_ACCESS_TOKEN_TTL_SECONDS must be a positive integer');
  }

  const AUTH_REFRESH_TOKEN_TTL_SECONDS = Number(rawRefreshTokenTtl ?? 60 * 60 * 24 * 14);
  if (!Number.isInteger(AUTH_REFRESH_TOKEN_TTL_SECONDS) || AUTH_REFRESH_TOKEN_TTL_SECONDS <= 0) {
    errors.push('AUTH_REFRESH_TOKEN_TTL_SECONDS must be a positive integer');
  }

  const FRONTEND_APP_ORIGINS =
    typeof rawFrontendAppOrigins === 'string' && rawFrontendAppOrigins.trim().length > 0
      ? rawFrontendAppOrigins
      : undefined;

  if (NODE_ENV !== 'development' && !FRONTEND_APP_ORIGINS) {
    errors.push('FRONTEND_APP_ORIGINS is required outside development');
  }

  const DEV_ADMIN_SEED_ENABLED =
    rawDevAdminSeedEnabled === true ||
    rawDevAdminSeedEnabled === 'true' ||
    rawDevAdminSeedEnabled === '1';

  if (NODE_ENV !== 'development' && DEV_ADMIN_SEED_ENABLED) {
    errors.push('DEV_ADMIN_SEED_ENABLED must not be enabled outside development');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment variables:\n- ${errors.join('\n- ')}`);
  }

  return {
    NODE_ENV,
    PORT,
    MONGODB_URI,
    MONGODB_DB_NAME,
    MONGODB_ENABLED,
    AUTH_TOKEN_SECRET,
    AUTH_ACCESS_TOKEN_TTL_SECONDS,
    AUTH_REFRESH_TOKEN_TTL_SECONDS,
    FRONTEND_APP_ORIGINS,
    DEV_ADMIN_EMAIL: typeof rawDevAdminEmail === 'string' ? rawDevAdminEmail : undefined,
    DEV_ADMIN_PASSWORD:
      typeof rawDevAdminPassword === 'string' ? rawDevAdminPassword : undefined,
    DEV_ADMIN_SEED_ENABLED,
  };
}
