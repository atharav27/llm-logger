import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Request, Response } from 'express';

/**
 * HttpOnly cookies: `{prefix}_user_access` + `{prefix}_user_refresh`.
 */
@Injectable()
export class AuthCookieService {
  static readonly USER_ROLE_SLUG = 'user';

  constructor(private readonly configService: ConfigService) {}

  getPrefix(): string {
    return this.configService.get<string>('auth.cookie.prefix') ?? 'ai-bot';
  }

  getAccessCookieName(roleSlug: string): string {
    return `${this.getPrefix()}_${roleSlug}_access`;
  }

  getRefreshCookieName(roleSlug: string): string {
    return `${this.getPrefix()}_${roleSlug}_refresh`;
  }

  getLegacyRefreshCookieName(): string {
    return (
      this.configService.get<string>('auth.refreshCookie.name') ??
      'refreshToken'
    );
  }

  private cookieBaseOptions(maxAge: number): CookieOptions {
    return {
      httpOnly: true,
      secure: this.configService.get<boolean>('auth.cookie.secure') ?? false,
      sameSite: (this.configService.get<string>('auth.cookie.sameSite') ??
        'lax') as 'lax' | 'strict' | 'none',
      path: '/',
      maxAge,
    };
  }

  setRoleCookies(
    response: Response,
    roleSlug: string,
    accessToken: string,
    refreshToken: string,
  ): void {
    this.clearLegacyRefreshCookie(response);

    const accessMs =
      this.configService.get<number>('auth.cookie.accessMaxAgeMs') ?? 3_600_000;
    const refreshMs =
      this.configService.get<number>('auth.cookie.refreshMaxAgeMs') ??
      7 * 86_400_000;

    response.cookie(
      this.getAccessCookieName(roleSlug),
      accessToken,
      this.cookieBaseOptions(accessMs),
    );
    response.cookie(
      this.getRefreshCookieName(roleSlug),
      refreshToken,
      this.cookieBaseOptions(refreshMs),
    );
  }

  clearRoleCookies(response: Response, roleSlug: string): void {
    const p = { path: '/' };
    response.clearCookie(this.getAccessCookieName(roleSlug), p);
    response.clearCookie(this.getRefreshCookieName(roleSlug), p);
  }

  clearLegacyRefreshCookie(response: Response): void {
    response.clearCookie(this.getLegacyRefreshCookieName(), { path: '/' });
  }

  getUserRefreshFromRequest(req: Request): string | undefined {
    return req.cookies?.[
      this.getRefreshCookieName(AuthCookieService.USER_ROLE_SLUG)
    ];
  }
}
