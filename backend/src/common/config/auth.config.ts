import { registerAs } from '@nestjs/config';

function durationToMs(value: string, fallbackMs: number): number {
  const m = value.trim().match(/^(\d+)\s*(s|m|h|d)$/i);
  if (!m) return fallbackMs;
  const n = Number.parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  switch (unit) {
    case 's':
      return n * 1000;
    case 'm':
      return n * 60_000;
    case 'h':
      return n * 3_600_000;
    case 'd':
      return n * 86_400_000;
    default:
      return fallbackMs;
  }
}

export default registerAs('auth', () => {
  const accessExp = process.env.AUTH_JWT_ACCESS_EXPIRATION ?? '3600s';
  const refreshExp = process.env.AUTH_JWT_REFRESH_EXPIRATION ?? '7d';

  return {
    jwt: {
      secret: process.env.AUTH_JWT_SECRET,
      accessExpiration: accessExp,
      refreshExpiration: refreshExp,
    },
    cookie: {
      prefix: process.env.AUTH_COOKIE_PREFIX ?? 'ai-bot',
      accessMaxAgeMs: durationToMs(accessExp, 3_600_000),
      refreshMaxAgeMs: durationToMs(refreshExp, 7 * 86_400_000),
      secure: process.env.AUTH_REFRESH_COOKIE_SECURE === 'true',
      sameSite: process.env.AUTH_REFRESH_COOKIE_SAME_SITE ?? 'lax',
    },
    refreshCookie: {
      name: process.env.AUTH_REFRESH_COOKIE_NAME ?? 'refreshToken',
      secure: process.env.AUTH_REFRESH_COOKIE_SECURE === 'true',
      sameSite: process.env.AUTH_REFRESH_COOKIE_SAME_SITE ?? 'lax',
    },
  };
});
