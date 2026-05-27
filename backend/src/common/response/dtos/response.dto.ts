import { ApiProperty } from '@nestjs/swagger';

export class ApiSuccessResponseDto<T = any> {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ example: '2026-03-11T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty()
  data: T;
}

export class ApiPaginationMetadataDto {
  @ApiProperty({ example: 1 })
  currentPage: number;

  @ApiProperty({ example: 10 })
  itemsPerPage: number;

  @ApiProperty({ example: 50 })
  totalItems: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export class ApiPaginatedDataDto<T = any> {
  @ApiProperty({ isArray: true })
  items: T[];

  @ApiProperty({ type: ApiPaginationMetadataDto })
  metadata: ApiPaginationMetadataDto;
}
