import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum AnalyticsPeriod {
  TODAY = 'today',
  LAST_7_DAYS = '7d',
  LAST_30_DAYS = '30d',
  LAST_90_DAYS = '90d',
}

export class AnalyticsPeriodQueryDto {
  @ApiPropertyOptional({
    enum: AnalyticsPeriod,
    default: AnalyticsPeriod.LAST_30_DAYS,
    example: AnalyticsPeriod.LAST_7_DAYS,
    description: 'Preset time window for analytics (MVP: presets only).',
  })
  @IsOptional()
  @IsEnum(AnalyticsPeriod)
  period?: AnalyticsPeriod;
}
