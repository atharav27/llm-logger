import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class LoginResponseDto {
  @ApiProperty({
    description:
      'JWT access token. Also set as HttpOnly cookie `ai-bot_user_access`.',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  @Expose()
  accessToken: string;

  @ApiProperty({
    description:
      'JWT refresh token. Also set as HttpOnly cookie `ai-bot_user_refresh`.',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidHlwIjoicmVmcmVzaCIsImlhdCI6MTUxNjIzOTAyMn0.refresh-signature-placeholder',
  })
  @Expose()
  refreshToken: string;
}
