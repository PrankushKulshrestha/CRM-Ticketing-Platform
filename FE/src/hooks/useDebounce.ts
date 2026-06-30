
import { useEffect, useState } from "react";

/**
 * Debounce a value — delays updating the returned value until
 * `delay` ms have elapsed since the last change.
 *
 * @example
 *   const debouncedSearch = useDebounce(search, 300);
 *   useEffect(() => { fetchResults(debouncedSearch) }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}