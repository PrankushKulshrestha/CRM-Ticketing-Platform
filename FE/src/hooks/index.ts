
/**
 * @/hooks — shared cross-feature hooks barrel
 *
 * Import any shared hook with:
 *   import { useDebounce, useDisclosure, usePagination } from "@/hooks"
 */

export { useDebounce }    from "./useDebounce";
export { useDisclosure }  from "./useDisclosure";
export { useMobile }      from "./useMobile";
export { usePagination }  from "./usePagination";
export { usePermissions } from "./usePermissions";
export { useQueryParams } from "./useQueryParams";
export { useApiError }    from "./useApiError";

// Re-export types
export type { DisclosureReturn }  from "./useDisclosure";
export type { PaginationReturn }  from "./usePagination";
export type { PermissionsReturn } from "./usePermissions";