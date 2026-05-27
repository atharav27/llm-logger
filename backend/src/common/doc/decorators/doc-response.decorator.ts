import { HttpStatus, SetMetadata, Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

import { RESPONSE_SERIALIZATION_META_KEY } from '../doc.constant';

export function DocResponse<T>(
  serializationClass: Type<T>,
  httpStatus: HttpStatus = HttpStatus.OK,
): MethodDecorator {
  return applyDecorators(
    SetMetadata(RESPONSE_SERIALIZATION_META_KEY, serializationClass),
    ApiExtraModels(serializationClass),
    ApiResponse({
      status: httpStatus,
      schema: {
        properties: {
          statusCode: { type: 'number', example: httpStatus },
          message: { type: 'string', example: 'Success' },
          timestamp: {
            type: 'string',
            example: new Date().toISOString(),
          },
          data: { $ref: getSchemaPath(serializationClass) },
        },
      },
    }),
  );
}
