import { ApiPropertyOptional } from '@nestjs/swagger';
import { Provider } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import {
  DEFAULT_MODEL_BY_PROVIDER,
  DEFAULT_PROVIDER,
} from '../llm/llm-catalog';

export class CreateConversationDto {
  @ApiPropertyOptional({ example: 'My first chat' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    enum: Provider,
    example: DEFAULT_PROVIDER,
    default: DEFAULT_PROVIDER,
  })
  @IsOptional()
  @IsEnum(Provider)
  provider?: Provider;

  @ApiPropertyOptional({
    example: DEFAULT_MODEL_BY_PROVIDER[DEFAULT_PROVIDER],
    default: DEFAULT_MODEL_BY_PROVIDER[DEFAULT_PROVIDER],
  })
  @IsOptional()
  @IsString()
  @ValidateIf((o: CreateConversationDto) => o.provider !== undefined)
  model?: string;

  @ApiPropertyOptional({ example: 'You are a helpful assistant.' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  systemPrompt?: string;
}
