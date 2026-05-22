import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export function getAllowedOrigins(): string[] {
  const configured = process.env.FRONTEND_APP_ORIGINS?.trim();

  if (configured) {
    return configured
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  return [
    'http://localhost:3000',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:3003',
  ];
}

export function createCorsOriginValidator(allowedOrigins: string[]): CorsOptions['origin'] {
  return (
    origin: string | undefined,
    callback: (error: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS origin not allowed: ${origin}`), false);
  };
}
