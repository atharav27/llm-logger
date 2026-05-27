import { registerAs } from '@nestjs/config';

export default registerAs('sentry', () => ({
  dsn: process.env.SENTRY_DSN ?? '',
  enabled: process.env.SENTRY_ENABLED === 'true',
}));
