import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessGuard } from 'src/common/auth/guards/jwt-access.guard';
import { ApiAuth } from 'src/common/doc/decorators/api-auth.decorator';

import { buildCatalogResponse } from './llm-catalog';

@ApiTags('LLM')
@ApiAuth()
@UseGuards(JwtAccessGuard)
@Controller({ path: 'llm', version: '1' })
export class LlmCatalogController {
  @Get('catalog')
  @ApiOperation({ summary: 'List allowed providers and models' })
  getCatalog() {
    return buildCatalogResponse();
  }
}
