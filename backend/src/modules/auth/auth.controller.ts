import {
  Body,
  Controller,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';

import { PublicRoute } from 'src/common/auth/decorators/public-route.decorator';
import { AuthCookieService } from 'src/common/auth/services/auth-cookie.service';
import { ApiRefreshCookieAuth } from 'src/common/doc/decorators/api-auth.decorator';
import { DocErrors } from 'src/common/doc/decorators/doc-errors.decorator';
import { DocResponse } from 'src/common/doc/decorators/doc-response.decorator';

import { LoginResponseDto } from './dtos/login-response.dto';
import { LoginDto } from './dtos/login.dto';
import { RegisterAuthResponseDto } from './dtos/register-auth-response.dto';
import { RegisterDto } from './dtos/register.dto';
import {
  AUTH_SERVICE,
  IAuthService,
} from './interfaces/auth.service.interface';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    @Inject(AUTH_SERVICE)
    private readonly authService: IAuthService,
    private readonly authCookieService: AuthCookieService,
  ) {}

  @PublicRoute()
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Sets HttpOnly cookies `ai-bot_user_access` and `ai-bot_user_refresh`.',
  })
  @DocResponse(RegisterAuthResponseDto, HttpStatus.CREATED)
  @DocErrors(409, 400)
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    this.authCookieService.setRoleCookies(
      res,
      AuthCookieService.USER_ROLE_SLUG,
      result.accessToken,
      result.refreshToken,
    );
    return {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @PublicRoute()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({
    summary: 'User login',
    description:
      'Sets HttpOnly `ai-bot_user_access` and `ai-bot_user_refresh`.',
  })
  @DocResponse(LoginResponseDto, HttpStatus.OK)
  @DocErrors(401, 403, 429)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    this.authCookieService.setRoleCookies(
      res,
      AuthCookieService.USER_ROLE_SLUG,
      result.accessToken,
      result.refreshToken,
    );
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @PublicRoute()
  @ApiRefreshCookieAuth()
  @ApiOperation({
    summary: 'Refresh access token using JWT refresh cookie',
    description:
      'Verifies JWT refresh token, issues new access JWT, reuses same refresh JWT until expiry.',
  })
  @DocResponse(LoginResponseDto, HttpStatus.OK)
  @DocErrors(401)
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = this.authCookieService.getUserRefreshFromRequest(req);
    if (!refreshToken) {
      throw new UnauthorizedException('Missing user refresh cookie');
    }
    const result = await this.authService.refresh(refreshToken);
    this.authCookieService.setRoleCookies(
      res,
      AuthCookieService.USER_ROLE_SLUG,
      result.accessToken,
      result.refreshToken,
    );
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @PublicRoute()
  @ApiRefreshCookieAuth()
  @ApiOperation({
    summary: 'Logout',
    description:
      'Clears HttpOnly auth cookies. Refresh JWT remains valid until expiry.',
  })
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    await this.authService.logout();
    this.authCookieService.clearRoleCookies(
      res,
      AuthCookieService.USER_ROLE_SLUG,
    );
    return { message: 'Logged out' };
  }
}
