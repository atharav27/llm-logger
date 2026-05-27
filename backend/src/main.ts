import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';
// cookie-parser is CJS `module.exports = fn`; default import → `.default()` and breaks in `node dist/main.js`.
import cookieParser = require('cookie-parser');
import helmet from 'helmet';
import { Logger as PinoLogger } from 'nestjs-pino';

import { AppModule } from './app/app.module';
import { AppEnvironment } from './app/enums/app.enum';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(PinoLogger));

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const env = configService.get<string>('app.env');
  const port = configService.get<number>('app.http.port') ?? 3000;
  const httpHost = configService.get<string>('app.http.host') ?? 'localhost';
  /** Hostname for URLs in logs (browsers on your machine use localhost when the app binds 0.0.0.0 in Docker). */
  const urlHost =
    httpHost === '0.0.0.0' || httpHost === '::' ? 'localhost' : httpHost;
  const origin = `http://${urlHost}:${port}`;

  app.use(
    compression({
      filter: (req, res) => {
        if (res.getHeader('Content-Type') === 'text/event-stream') {
          return false;
        }
        return compression.filter(req, res);
      },
    }),
  );
  app.use(cookieParser());

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    }),
  );

  app.setGlobalPrefix('/api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigins = configService.get<string[]>('app.cors.origins');
  const useWildcard = corsOrigins?.includes('*');

  app.enableCors({
    origin: useWildcard
      ? (_origin, callback) => callback(null, true)
      : corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  const swaggerEnabled = env !== AppEnvironment.PRODUCTION;
  const swaggerPath = 'api/docs';

  if (swaggerEnabled) {
    const cookiePrefix =
      configService.get<string>('auth.cookie.prefix') ?? 'ai-bot';
    const accessCookieName = `${cookiePrefix}_user_access`;
    const refreshCookieName = `${cookiePrefix}_user_refresh`;

    const config = new DocumentBuilder()
      .setTitle('AI-BOT API')
      .setDescription(
        [
          '**Auth in Swagger**',
          '1. Call `POST /auth/login` or `register` — browser stores HttpOnly cookies when `withCredentials` is enabled.',
          '2. **Option A:** Protected routes work automatically via cookies (same origin).',
          '3. **Option B:** Click **Authorize** → Bearer → paste `accessToken` from the login response body.',
          '',
          `Cookies: \`${accessCookieName}\` (access), \`${refreshCookieName}\` (refresh).`,
        ].join('\n'),
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste accessToken from login/register JSON response',
        },
        'bearer',
      )
      .addCookieAuth(
        accessCookieName,
        {
          type: 'apiKey',
          in: 'cookie',
          name: accessCookieName,
          description:
            'Set by login/register (HttpOnly). Sent automatically on same-origin requests when withCredentials is on.',
        },
        'access-cookie',
      )
      .addCookieAuth(
        refreshCookieName,
        {
          type: 'apiKey',
          in: 'cookie',
          name: refreshCookieName,
          description:
            'Set by login/register. Required for POST /auth/refresh.',
        },
        'refresh-cookie',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(swaggerPath, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        withCredentials: true,
      },
    });
  }

  app.enableShutdownHooks();

  const listenHost =
    httpHost === '0.0.0.0' || httpHost === '::' ? '0.0.0.0' : httpHost;
  await app.listen(port, listenHost);

  logger.log(`Application listening on ${listenHost}:${port} [${env}]`);
  logger.log(`API base (v1)     ${origin}/api/v1`);
  if (swaggerEnabled) {
    logger.log(`Swagger UI        ${origin}/${swaggerPath}`);
    logger.log(`OpenAPI JSON      ${origin}/${swaggerPath}-json`);
  }
}

bootstrap();
