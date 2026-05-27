import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';

import { PrismaService } from 'src/common/database/prisma.service';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  };

  const jwtMock = {
    sign: jest.fn().mockReturnValue('new-access-token'),
    verify: jest.fn(),
  };

  const configMock = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        'auth.jwt.secret': 'secret',
        'auth.jwt.refreshExpiration': '7d',
      };
      return values[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  it('issues new access token and reuses refresh JWT on valid refresh', async () => {
    const refreshJwt = 'existing-refresh-jwt';
    jwtMock.verify.mockReturnValue({
      sub: 'user-id',
      email: 'user@test.com',
      actor: 'USER',
      type: 'refresh',
    });

    const result = await service.refresh(refreshJwt);

    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).toBe(refreshJwt);
    expect(jwtMock.sign).toHaveBeenCalledTimes(1);
  });

  it('throws unauthorized when refresh JWT has wrong type', async () => {
    jwtMock.verify.mockReturnValue({
      sub: 'user-id',
      email: 'user@test.com',
      actor: 'USER',
      type: 'access',
    });

    await expect(service.refresh('bad-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws unauthorized when refresh JWT has wrong actor', async () => {
    jwtMock.verify.mockReturnValue({
      sub: 'user-id',
      email: 'user@test.com',
      actor: 'OTHER',
      type: 'refresh',
    });

    await expect(service.refresh('bad-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws unauthorized when JWT verify fails', async () => {
    jwtMock.verify.mockImplementation(() => {
      throw new Error('invalid');
    });

    await expect(service.refresh('expired-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
