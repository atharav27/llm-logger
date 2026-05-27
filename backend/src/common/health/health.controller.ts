import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

import { PublicRoute } from 'src/common/auth/decorators/public-route.decorator';

import { PrismaHealthIndicator } from './indicators/prisma-health.indicator';

@ApiTags('Health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaIndicator: PrismaHealthIndicator,
  ) {}

  @PublicRoute()
  @ApiOperation({ summary: 'Full health check — database connectivity' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaIndicator.isHealthy('database'),
    ]);
  }

  @PublicRoute()
  @ApiOperation({ summary: 'Simple liveness check — no DB call' })
  @ApiResponse({ status: 200, description: '{ status: "ok" }' })
  @Get('simple')
  simple() {
    return { status: 'ok' };
  }
}
