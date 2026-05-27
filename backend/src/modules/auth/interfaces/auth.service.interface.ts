import type { User } from '@prisma/client';

import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';

export const AUTH_SERVICE = Symbol('AUTH_SERVICE');

export type SafeUser = Omit<User, 'passwordHash'>;

export interface IAuthService {
  register(dto: RegisterDto): Promise<{
    user: SafeUser;
    accessToken: string;
    refreshToken: string;
  }>;
  login(dto: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }>;
  refresh(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }>;
  logout(): Promise<void>;
  getProfile(userId: string): Promise<SafeUser>;
}
