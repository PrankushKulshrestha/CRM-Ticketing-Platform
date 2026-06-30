
export interface PaginationQuery {
  page?: unknown;
  limit?: unknown;
}

export interface PaginationResult {
  page: number;
  limit: number;
  skip: number;
}

/*
|--------------------------------------------------------------------------
| Paginated Response Contract
|--------------------------------------------------------------------------
*/

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/*
|--------------------------------------------------------------------------
| Safe Parsers
|--------------------------------------------------------------------------
*/

function toPositiveInt(
  value: unknown,
  fallback: number,
  max: number
): number {
  const num = Number(value);

  if (!Number.isFinite(num) || num <= 0) {
    return fallback;
  }

  return Math.min(Math.floor(num), max);
}

/*
|--------------------------------------------------------------------------
| Pagination Builder
|--------------------------------------------------------------------------
*/

export function getPagination(
  query: PaginationQuery,
  options?: {
    defaultPage?: number;
    defaultLimit?: number;
    maxLimit?: number;
  }
): PaginationResult {
  const {
    defaultPage = 1,
    defaultLimit = 10,
    maxLimit = 100,
  } = options || {};

  const page = toPositiveInt(query.page, defaultPage, Number.MAX_SAFE_INTEGER);

  const limit = toPositiveInt(
    query.limit,
    defaultLimit,
    maxLimit
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

/*
|--------------------------------------------------------------------------
| Response Builder
|--------------------------------------------------------------------------
*/

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  const safeTotal = Math.max(0, total);

  const safeLimit = Math.max(1, limit); // prevents division by zero

  const totalPages =
    safeTotal === 0 ? 0 : Math.ceil(safeTotal / safeLimit);

  const safePage = Math.max(1, page);

  return {
    data,
    pagination: {
      total: safeTotal,
      page: safePage,
      limit: safeLimit,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1 && totalPages > 0,
    },
  };
}