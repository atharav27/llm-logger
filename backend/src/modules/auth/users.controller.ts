import { Controller, Get, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  CurrentUser,
  CurrentUserPayload,
} from 'src/common/auth/decorators/current-user.decorator';
import { JwtAccessGuard } from 'src/common/auth/guards/jwt-access.guard';
import { ApiAuth } from 'src/common/doc/decorators/api-auth.decorator';
import { DocErrors } from 'src/common/doc/decorators/doc-errors.decorator';
import { DocResponse } from 'src/common/doc/decorators/doc-response.decorator';

import { AuthService } from './auth.service';
import { UserResponseDto } from './dtos/user-response.dto';

@ApiTags('Users')
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly authService: AuthService) {}

  @ApiAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @DocResponse(UserResponseDto, HttpStatus.OK)
  @DocErrors(401, 404)
  @UseGuards(JwtAccessGuard)
  @Get('me')
  getMe(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getProfile(user.id);
  }
}
