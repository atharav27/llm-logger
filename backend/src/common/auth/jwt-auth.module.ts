import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { JwtAccessGuard } from './guards/jwt-access.guard';
import { AuthCookieService } from './services/auth-cookie.service';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('auth.jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('auth.jwt.accessExpiration'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [JwtAccessStrategy, JwtAccessGuard, AuthCookieService],
  exports: [JwtModule, JwtAccessGuard, AuthCookieService],
})
export class JwtAuthModule {}
