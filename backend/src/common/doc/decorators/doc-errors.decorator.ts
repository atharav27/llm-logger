import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse } from '@nestjs/swagger';

import { ApiErrorResponseDto } from '../../response/dtos/response-error.dto';
import { HTTP_STATUS_MESSAGES } from '../doc.constant';

export function DocErrors(...statusCodes: number[]): MethodDecorator {
  const decorators = [ApiExtraModels(ApiErrorResponseDto)];

  for (const statusCode of statusCodes) {
    const description =
      HTTP_STATUS_MESSAGES[statusCode] ?? `HTTP ${statusCode}`;

    decorators.push(
      ApiResponse({
        status: statusCode,
        description,
        schema: {
          properties: {
            statusCode: { type: 'number', example: statusCode },
            message: { type: 'string', example: description },
            timestamp: { type: 'string', example: new Date().toISOString() },
            error: {
              oneOf: [
                { type: 'string' },
                { type: 'array', items: { type: 'string' } },
              ],
            },
          },
        },
      }) as MethodDecorator,
    );
  }

  return applyDecorators(...decorators);
}
