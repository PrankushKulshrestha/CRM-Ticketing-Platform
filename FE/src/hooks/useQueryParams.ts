
import { useMemo } from "react";
import { useLocation } from "react-router-dom";

/**
 * Returns a URLSearchParams instance parsed from the current URL.
 * Recalculates only when the `search` string changes.
 *
 * @example
 *   const params = useQueryParams();
 *   const status = params.get("status"); // "open" | null
 */
export function useQueryParams(): URLSearchParams {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}