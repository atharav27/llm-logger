import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AuthTokenPayload } from '../interfaces/auth-token.interface';
import { AuthCookieService } from '../services/auth-cookie.service';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const prefix = configService.get<string>('auth.cookie.prefix') ?? 'ai-bot';
    const userSlug = AuthCookieService.USER_ROLE_SLUG;

    const jwtFromRequest = ExtractJwt.fromExtractors([
      (req: Request) => req?.cookies?.[`${prefix}_${userSlug}_access`] ?? null,
      ExtractJwt.fromAuthHeaderAsBearerToken(),
    ]);

    super({
      jwtFromRequest,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('auth.jwt.secret'),
    });
  }

  validate(payload: AuthTokenPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      actor: payload.actor,
    };
  }
}
