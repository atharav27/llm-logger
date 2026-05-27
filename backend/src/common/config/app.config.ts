import { registerAs } from '@nestjs/config';

import { AppEnvironment } from 'src/app/enums/app.enum';

export default registerAs('app', () => {
  const corsOrigins = process.env.APP_CORS_ORIGINS
    ? process.env.APP_CORS_ORIGINS.split(',').map((o) => o.trim())
    : ['*'];

  return {
    env: process.env.NODE_ENV ?? AppEnvironment.LOCAL,
    name: process.env.APP_NAME ?? 'ai-bot-backend',
    debug: process.env.APP_DEBUG === 'true',

    http: {
      host: process.env.HTTP_HOST ?? 'localhost',
      port: process.env.HTTP_PORT
        ? Number.parseInt(process.env.HTTP_PORT, 10)
        : 3000,
    },

    cors: {
      origins: corsOrigins,
    },

    globalPrefix: '/api',

    logLevel: process.env.APP_LOG_LEVEL ?? 'info',
  };
});
