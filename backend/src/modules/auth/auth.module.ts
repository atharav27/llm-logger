import { Module } from '@nestjs/common';

import { JwtAuthModule } from 'src/common/auth/jwt-auth.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AUTH_SERVICE } from './interfaces/auth.service.interface';
import { UsersController } from './users.controller';

@Module({
  imports: [JwtAuthModule],
  controllers: [AuthController, UsersController],
  providers: [AuthService, { provide: AUTH_SERVICE, useExisting: AuthService }],
  exports: [AuthService, AUTH_SERVICE],
})
export class AuthModule {}
