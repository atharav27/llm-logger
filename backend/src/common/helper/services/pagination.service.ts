import { Injectable } from '@nestjs/common';

import {
  PaginatedResult,
  PaginateOptions,
} from '../interfaces/pagination.interface';

@Injectable()
export class PaginationService {
  async paginate<T>(
    delegate: any,
    where: Record<string, any>,
    options: PaginateOptions,
  ): Promise<PaginatedResult<T>> {
    const { page, limit, orderBy, include, select } = options;
    const skip = (page - 1) * limit;

    const queryArgs: Record<string, any> = { where, skip, take: limit };
    if (orderBy) queryArgs.orderBy = orderBy;
    if (include) queryArgs.include = include;
    if (select) queryArgs.select = select;

    const [totalItems, items] = await Promise.all([
      delegate.count({ where }),
      delegate.findMany(queryArgs),
    ]);

    return {
      items,
      metadata: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }
}
