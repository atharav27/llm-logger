import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, Reflector } from '@nestjs/core';

import { LoggerModule } from '../logger/logger.module';
import { ResponseExceptionFilter } from './filters/response-exception.filter';
import { ResponseInterceptor } from './interceptors/response.interceptor';

@Module({
  imports: [LoggerModule],
  providers: [
    Reflector,
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: ResponseExceptionFilter },
  ],
})
export class ResponseModule {}
