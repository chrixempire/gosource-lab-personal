import './utils/secrets-loader';
import { NestFactory } from '@nestjs/core';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SanitizationPipe } from './utils/sanitization.pipe';
import { createCorsOriginValidator, getAllowedOrigins } from './utils/cors.utils';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = getAllowedOrigins();

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '2',
  });
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: false, forbidNonWhitelisted: true }),
    new SanitizationPipe(),
  );

  // Only enable Swagger in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Go Source V2 API')
      .setDescription('GO Source description')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('swagger/secret', app, document);
  }

  app.enableCors({
    origin: createCorsOriginValidator(allowedOrigins),
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  } satisfies CorsOptions);
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
