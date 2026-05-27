import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { plainToInstance } from 'class-transformer';
import { Observable, map } from 'rxjs';

import { RESPONSE_SERIALIZATION_META_KEY } from '../../doc/doc.constant';
import { SKIP_RESPONSE_TRANSFORM_KEY } from '../decorators/skip-response-transform.decorator';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const skipTransform = this.reflector.getAllAndOverride<boolean>(
      SKIP_RESPONSE_TRANSFORM_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipTransform) {
      return next.handle();
    }

    const response = context.switchToHttp().getResponse();
    if (
      response.headersSent ||
      response.getHeader?.('Content-Type') === 'text/event-stream'
    ) {
      return next.handle();
    }

    const serializationClass = this.reflector.get(
      RESPONSE_SERIALIZATION_META_KEY,
      context.getHandler(),
    );

    return next.handle().pipe(
      map((responseBody) => {
        const response = context.switchToHttp().getResponse();
        const statusCode: number = response.statusCode;

        const data = serializationClass
          ? plainToInstance(serializationClass, responseBody, {
              excludeExtraneousValues: true,
            })
          : responseBody;

        return {
          statusCode,
          message: 'Success',
          timestamp: new Date().toISOString(),
          data,
        };
      }),
    );
  }
}
