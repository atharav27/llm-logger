import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/nestjs';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';

import { ApiErrorResponseDto } from '../dtos/response-error.dto';

@Catch()
export class ResponseExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ResponseExceptionFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'An unexpected error occurred';
    let error: string | string[] | undefined;

    if (exception instanceof BadRequestException) {
      const exceptionResponse = exception.getResponse() as any;
      message = 'Validation failed';

      if (Array.isArray(exceptionResponse.message)) {
        error = exceptionResponse.message;
      } else {
        message = exceptionResponse.message || message;
      }
    } else if (exception instanceof HttpException) {
      message = exception.message;
    }

    const isDebug = this.configService.get<boolean>('app.debug');
    if (
      isDebug &&
      !error &&
      exception instanceof Error &&
      statusCode >= HttpStatus.INTERNAL_SERVER_ERROR
    ) {
      error = exception.stack;
    }

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const correlationId = (request as any).correlationId;

      this.logger.error(
        {
          correlationId,
          method: request.method,
          url: request.url,
          statusCode,
          stack: exception instanceof Error ? exception.stack : undefined,
        },
        message,
      );

      if (Sentry.isInitialized()) {
        Sentry.withScope((scope) => {
          scope.setTag('correlationId', correlationId);
          scope.setContext('request', {
            method: request.method,
            url: request.url,
            userId: (request as any).user?.id,
          });
          Sentry.captureException(exception);
        });
      }
    }

    const errorResponse: ApiErrorResponseDto = {
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      ...(error && { error }),
    };

    response.status(statusCode).json(errorResponse);
  }
}
