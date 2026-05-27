import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/nestjs';

@Module({})
export class SentryModule implements OnModuleInit {
  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const dsn = this.config.get<string>('sentry.dsn');
    const enabled = this.config.get<boolean>('sentry.enabled');

    if (!enabled || !dsn) return;

    const env = this.config.get<string>('app.env') ?? 'local';

    Sentry.init({
      dsn,
      environment: env,
      tracesSampleRate: env === 'production' ? 0.2 : 1.0,
      beforeSend(event) {
        if (event.request?.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }
        return event;
      },
    });
  }
}
