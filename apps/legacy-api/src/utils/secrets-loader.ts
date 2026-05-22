import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const SECRETS_DIR = process.env.ENV_SECRETS_DIR || '/run/secrets';
const DOCKER_SECRET_PREFIX = 'DOCKER-SECRET:';

/**
 * Strategy A: Path-based resolution.
 * If an env var's value is a path starting with the secrets directory
 * (e.g. DB_PASSWORD=/run/secrets/db_password), read the file and replace
 * the env var with its contents.
 */
function resolvePathBasedSecrets(): void {
  for (const [key, value] of Object.entries(process.env)) {
    if (value && value.startsWith(SECRETS_DIR + '/')) {
      if (existsSync(value)) {
        process.env[key] = readFileSync(value, 'utf-8').trim();
      } else {
        console.warn(
          `[secrets-loader] Secret file not found for ${key}: ${value}`,
        );
      }
    }
  }
}

/**
 * Strategy B: DOCKER-SECRET: prefix resolution.
 * Mirrors the logic previously in docker-entrypoint.sh.
 * If an env var's value is "DOCKER-SECRET:<secret_name>", read
 * /run/secrets/<secret_name> and replace the env var with its contents.
 *
 * Example in docker-compose / stack yml:
 *   environment:
 *     DB_PASSWORD: DOCKER-SECRET:db_password
 *   secrets:
 *     - db_password
 */
function resolveDockerSecretPrefixed(): void {
  for (const [key, value] of Object.entries(process.env)) {
    if (value && value.startsWith(DOCKER_SECRET_PREFIX)) {
      const secretName = value.slice(DOCKER_SECRET_PREFIX.length);
      const secretPath = join(SECRETS_DIR, secretName);
      if (existsSync(secretPath)) {
        process.env[key] = readFileSync(secretPath, 'utf-8').trim();
      } else {
        console.warn(
          `[secrets-loader] Secret file not found for ${key}: ${secretPath}`,
        );
      }
    }
  }
}

// Runs immediately when this module is imported — must be the first import
// in main.ts so process.env is fully populated before any NestJS module
// decorator is evaluated.
resolvePathBasedSecrets();
resolveDockerSecretPrefixed();
