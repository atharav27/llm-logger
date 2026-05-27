import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { LoggerModule } from '../logger/logger.module';
import { RequestLoggerMiddleware } from './middlewares/request-logger.middleware';

@Module({
  imports: [LoggerModule],
})
export class RequestModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
