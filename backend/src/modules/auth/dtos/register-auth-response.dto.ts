import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { UserResponseDto } from './user-response.dto';

export class RegisterAuthResponseDto {
  @ApiProperty({ type: UserResponseDto })
  @Expose()
  @Type(() => UserResponseDto)
  user: UserResponseDto;

  @ApiProperty({
    description: 'JWT access token (also in HttpOnly cookie)',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  @Expose()
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token (also in HttpOnly cookie)',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidHlwIjoicmVmcmVzaCIsImlhdCI6MTUxNjIzOTAyMn0.refresh-signature-placeholder',
  })
  @Expose()
  refreshToken: string;
}
