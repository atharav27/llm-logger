import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Provider } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import {
  DEFAULT_MODEL_BY_PROVIDER,
  DEFAULT_PROVIDER,
} from '../llm/llm-catalog';

export class SendMessageDto {
  @ApiProperty({ example: 'What is the capital of France?' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(10_000)
  content: string;

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
  model?: string;
}
