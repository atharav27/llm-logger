import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'John Doe' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'user@example.com' })
  @Expose()
  email: string;

  @ApiPropertyOptional({ example: null, nullable: true })
  @Expose()
  avatarUrl?: string | null;

  @ApiProperty({ example: '2026-05-25T14:22:31.818Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2026-05-25T14:22:31.818Z' })
  @Expose()
  updatedAt: Date;
}
