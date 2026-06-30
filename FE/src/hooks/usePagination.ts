
import { useCallback, useState } from "react";

export interface PaginationReturn {
  page: number;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToFirst: () => void;
  canNext: (totalPages: number) => boolean;
  canPrev: () => boolean;
}

/**
 * Manage page state for paginated queries.
 *
 * @example
 *   const { page, nextPage, prevPage, canNext } = usePagination();
 *   const { data } = useTickets({ page });
 */
export function usePagination(initialPage = 1): PaginationReturn {
  const [page, setPage] = useState(initialPage);

  const nextPage  = useCallback(() => setPage((p) => p + 1),           []);
  const prevPage  = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const goToFirst = useCallback(() => setPage(1),                       []);

  const canNext = useCallback((totalPages: number) => page < totalPages, [page]);
  const canPrev = useCallback(() => page > 1,                            [page]);

  return { page, setPage, nextPage, prevPage, goToFirst, canNext, canPrev };
}