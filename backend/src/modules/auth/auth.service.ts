import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { AuthTokenPayload } from 'src/common/auth/interfaces/auth-token.interface';
import { PrismaService } from 'src/common/database/prisma.service';

import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { IAuthService, SafeUser } from './interfaces/auth.service.interface';

const SALT_ROUNDS = 10;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

@Injectable()
export class AuthService implements IAuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{
    user: SafeUser;
    accessToken: string;
    refreshToken: string;
  }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
      },
    });

    const accessToken = this.createAccessToken(user.id, user.email);
    const refreshToken = this.createRefreshToken(user.id, user.email);

    return {
      user: this.toSafeUser(user),
      accessToken,
      refreshToken,
    };
  }

  async login(dto: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException(
        'Account is locked due to too many failed attempts. Try again later.',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      const attempts = user.failedLoginAttempts + 1;
      const updateData: { failedLoginAttempts: number; lockedUntil?: Date } = {
        failedLoginAttempts: attempts,
      };

      if (attempts >= MAX_FAILED_ATTEMPTS) {
        updateData.lockedUntil = new Date(
          Date.now() + LOCK_DURATION_MINUTES * 60 * 1000,
        );
        this.logger.warn(`User account locked: ${user.email}`);
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.failedLoginAttempts > 0) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    const accessToken = this.createAccessToken(user.id, user.email);
    const refreshToken = this.createRefreshToken(user.id, user.email);

    return { accessToken, refreshToken };
  }

  async refresh(token: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload = this.verifyRefreshToken(token);
    const accessToken = this.createAccessToken(payload.sub, payload.email);
    return { accessToken, refreshToken: token };
  }

  async logout(): Promise<void> {
    // Stateless JWT refresh — revocation is client-side (clear cookies).
  }

  async getProfile(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toSafeUser(user);
  }

  private createAccessToken(userId: string, email: string): string {
    const payload: AuthTokenPayload = {
      sub: userId,
      email,
      actor: 'USER',
      type: 'access',
    };
    return this.jwtService.sign(payload);
  }

  private createRefreshToken(userId: string, email: string): string {
    const payload: AuthTokenPayload = {
      sub: userId,
      email,
      actor: 'USER',
      type: 'refresh',
    };
    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('auth.jwt.refreshExpiration'),
    });
  }

  private verifyRefreshToken(token: string): AuthTokenPayload {
    let payload: AuthTokenPayload;

    try {
      payload = this.jwtService.verify<AuthTokenPayload>(token, {
        secret: this.configService.get<string>('auth.jwt.secret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh' || payload.actor !== 'USER') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return payload;
  }

  private toSafeUser(user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    failedLoginAttempts: number;
    lockedUntil: Date | null;
    createdAt: Date;
    updatedAt: Date;
    passwordHash: string;
  }): SafeUser {
    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
  }
}
