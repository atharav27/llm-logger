import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';

/** OpenAPI: satisfy Bearer OR access cookie (same as JwtAccessStrategy). */
export const SWAGGER_ACCESS_COOKIE_AUTH = 'access-cookie';
export const SWAGGER_REFRESH_COOKIE_AUTH = 'refresh-cookie';

export function ApiAuth(): MethodDecorator & ClassDecorator {
  return applyDecorators(
    ApiBearerAuth(),
    ApiCookieAuth(SWAGGER_ACCESS_COOKIE_AUTH),
  );
}

export function ApiRefreshCookieAuth(): MethodDecorator & ClassDecorator {
  return applyDecorators(ApiCookieAuth(SWAGGER_REFRESH_COOKIE_AUTH));
}
