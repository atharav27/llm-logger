import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { JwtAuthModule } from './auth/jwt-auth.module';
import configs from './config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { HelperModule } from './helper/helper.module';
import { LoggerModule } from './logger/logger.module';
import { SentryModule } from './logger/sentry.module';
import { RequestModule } from './request/request.module';
import { ResponseModule } from './response/response.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: configs,
      isGlobal: true,
      cache: true,
      envFilePath: ['.env'],
      expandVariables: true,
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    LoggerModule,
    SentryModule,
    DatabaseModule,
    JwtAuthModule,
    HealthModule,
    HelperModule,
    RequestModule,
    ResponseModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class CommonModule {}
