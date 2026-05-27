import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  CurrentUser,
  CurrentUserPayload,
} from 'src/common/auth/decorators/current-user.decorator';
import { JwtAccessGuard } from 'src/common/auth/guards/jwt-access.guard';
import { ApiAuth } from 'src/common/doc/decorators/api-auth.decorator';

import { AnalyticsService } from './analytics.service';
import { AnalyticsPeriodQueryDto } from './dtos/analytics-period.dto';

@ApiTags('Analytics')
@ApiAuth()
@UseGuards(JwtAccessGuard)
@Controller({ path: 'analytics', version: '1' })
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Dashboard overview — cards/KPIs for selected period',
  })
  @ApiResponse({ status: 200, description: 'Overview metrics' })
  getOverview(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: AnalyticsPeriodQueryDto,
  ) {
    return this.analyticsService.getOverview(user.id, query.period);
  }

  @Get('timeseries')
  @ApiOperation({ summary: 'Dashboard charts — daily time series for period' })
  @ApiResponse({ status: 200, description: 'Time series points' })
  getTimeseries(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: AnalyticsPeriodQueryDto,
  ) {
    return this.analyticsService.getTimeseries(user.id, query.period);
  }
}
