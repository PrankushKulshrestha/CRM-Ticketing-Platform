
/**
 * src/lib/utils.ts — thin re-export shim
 *
 * Resolves "@/lib/utils" for all existing imports.
 * The real implementations live in src/lib/utils/ (the sub-folder barrel).
 *
 * DO NOT add implementations here — put them in the appropriate sub-module
 * under src/lib/utils/ and re-export from src/lib/index.ts.
 */
export * from "./index";