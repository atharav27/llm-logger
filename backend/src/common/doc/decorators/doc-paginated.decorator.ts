import { HttpStatus, SetMetadata, Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

import { ApiPaginationMetadataDto } from '../../response/dtos/response.dto';
import { RESPONSE_SERIALIZATION_META_KEY } from '../doc.constant';

export function DocPaginatedResponse<T>(
  serializationClass: Type<T>,
  httpStatus: HttpStatus = HttpStatus.OK,
): MethodDecorator {
  return applyDecorators(
    SetMetadata(RESPONSE_SERIALIZATION_META_KEY, serializationClass),
    ApiExtraModels(serializationClass, ApiPaginationMetadataDto),
    ApiResponse({
      status: httpStatus,
      schema: {
        properties: {
          statusCode: { type: 'number', example: httpStatus },
          message: { type: 'string', example: 'Success' },
          timestamp: { type: 'string', example: new Date().toISOString() },
          data: {
            properties: {
              items: {
                type: 'array',
                items: { $ref: getSchemaPath(serializationClass) },
              },
              metadata: { $ref: getSchemaPath(ApiPaginationMetadataDto) },
            },
          },
        },
      },
    }),
  );
}
