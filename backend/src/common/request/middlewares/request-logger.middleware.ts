import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext('HTTP');
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const correlationId = crypto.randomUUID();
    (req as any).correlationId = correlationId;
    res.setHeader('X-Correlation-Id', correlationId);

    const { method, originalUrl, ip } = req;
    const requestSize = req.headers['content-length'] ?? 0;
    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length') ?? 0;
      const durationMs = Date.now() - startTime;

      const logFn =
        statusCode >= 500
          ? this.logger.error.bind(this.logger)
          : statusCode >= 400
            ? this.logger.warn.bind(this.logger)
            : this.logger.info.bind(this.logger);

      logFn(
        {
          correlationId,
          method,
          url: originalUrl,
          statusCode,
          contentLength: Number(contentLength),
          durationMs,
          ip,
          requestSize: Number(requestSize),
        },
        `${method} ${originalUrl} ${statusCode} - ${durationMs}ms`,
      );
    });

    next();
  }
}
