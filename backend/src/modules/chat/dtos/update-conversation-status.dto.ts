import { ApiProperty } from '@nestjs/swagger';
import { ConversationStatus } from '@prisma/client';
import { IsIn } from 'class-validator';

export class UpdateConversationStatusDto {
  @ApiProperty({
    enum: [ConversationStatus.ACTIVE, ConversationStatus.CANCELLED],
  })
  @IsIn([ConversationStatus.ACTIVE, ConversationStatus.CANCELLED])
  status: 'ACTIVE' | 'CANCELLED';
}
