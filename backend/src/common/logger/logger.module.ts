import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

import { AppEnvironment } from 'src/app/enums/app.enum';

const PROD_ENVS: string[] = [AppEnvironment.PRODUCTION, AppEnvironment.STAGING];

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const env = config.get<string>('app.env') ?? AppEnvironment.LOCAL;
        const logLevel = config.get<string>('app.logLevel') ?? 'info';
        const isProd = PROD_ENVS.includes(env);

        return {
          pinoHttp: {
            level: logLevel,
            autoLogging: false,
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.headers["x-api-key"]',
              ],
              censor: '[REDACTED]',
            },
            ...(isProd
              ? { formatters: { level: (label) => ({ level: label }) } }
              : {
                  transport: {
                    target: 'pino-pretty',
                    options: {
                      colorize: true,
                      singleLine: true,
                      translateTime: 'SYS:standard',
                      ignore: 'pid,hostname',
                    },
                  },
                }),
          },
        };
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
