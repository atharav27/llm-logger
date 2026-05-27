export interface PaginationMetadata {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  metadata: PaginationMetadata;
}

export interface PaginateOptions {
  page: number;
  limit: number;
  orderBy?: Record<string, any>;
  include?: Record<string, any>;
  select?: Record<string, any>;
}
