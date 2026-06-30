

/*
|--------------------------------------------------------------------------
| Global Application Constants
|--------------------------------------------------------------------------
| Strongly-typed, immutable, production-safe constants
| Designed for scalability, consistency, and strict typing
|--------------------------------------------------------------------------
*/

/* -------------------------------------------------------------------------- */
/* Pagination                                                                 */
/* -------------------------------------------------------------------------- */

export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  MAX_EXPORT_LIMIT: 5000,
} as const);

export type PageNumber = number;

/* -------------------------------------------------------------------------- */
/* Authentication                                                            */
/* -------------------------------------------------------------------------- */

export const AUTH = Object.freeze({
  PASSWORD_MIN_LENGTH: 8,
} as const);

/* -------------------------------------------------------------------------- */
/* Ticketing                                                                 */
/* -------------------------------------------------------------------------- */

export const TICKET_NUMBER_PREFIX = "TKT" as const;

export const TICKET_STATUS = Object.freeze({
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  PENDING: "pending",
  RESOLVED: "resolved",
  CLOSED: "closed",
  ESCALATED: "escalated",
  ARCHIVED: "archived",
} as const);

export type TicketStatus =
  (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];

export const ACTIVE_TICKET_STATUSES = Object.freeze([
  TICKET_STATUS.OPEN,
  TICKET_STATUS.IN_PROGRESS,
  TICKET_STATUS.PENDING,
  TICKET_STATUS.ESCALATED,
] as const);

export const CLOSED_TICKET_STATUSES = Object.freeze([
  TICKET_STATUS.RESOLVED,
  TICKET_STATUS.CLOSED,
] as const);

export const TICKET_PRIORITY = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
} as const);

export type TicketPriority =
  (typeof TICKET_PRIORITY)[keyof typeof TICKET_PRIORITY];

/* -------------------------------------------------------------------------- */
/* Users & Roles                                                             */
/* -------------------------------------------------------------------------- */

export const USER_ROLES = Object.freeze({
  ADMIN: "admin",
  MANAGER: "manager",
  AGENT: "agent",
} as const);

export type UserRole =
  (typeof USER_ROLES)[keyof typeof USER_ROLES];

/* -------------------------------------------------------------------------- */
/* Permissions                                                               */
/* -------------------------------------------------------------------------- */

export const PERMISSIONS = Object.freeze({
  TICKETS_READ: "tickets:read",
  TICKETS_WRITE: "tickets:write",
  TICKETS_DELETE: "tickets:delete",

  USERS_READ: "users:read",
  USERS_WRITE: "users:write",
  USERS_DELETE: "users:delete",

  ANALYTICS_READ: "analytics:read",

  SETTINGS_READ: "settings:read",
  SETTINGS_WRITE: "settings:write",

  AUDIT_READ: "audit:read",
} as const);

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/* Role → Permission mapping */
export const ROLE_PERMISSIONS: Readonly<
  Record<UserRole, readonly Permission[]>
> = {
  [USER_ROLES.ADMIN]: Object.values(PERMISSIONS),

  [USER_ROLES.MANAGER]: [
    PERMISSIONS.TICKETS_READ,
    PERMISSIONS.TICKETS_WRITE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.AUDIT_READ,
  ],

  [USER_ROLES.AGENT]: [
    PERMISSIONS.TICKETS_READ,
    PERMISSIONS.TICKETS_WRITE,
    PERMISSIONS.ANALYTICS_READ,
  ],
} as const;

/* -------------------------------------------------------------------------- */
/* SLA                                                                       */
/* -------------------------------------------------------------------------- */

export const SLA_HOURS = Object.freeze({
  LOW: 72,
  MEDIUM: 48,
  HIGH: 24,
  CRITICAL: 4,
} as const);

/* -------------------------------------------------------------------------- */
/* Sorting                                                                   */
/* -------------------------------------------------------------------------- */

export const SORT_ORDER = Object.freeze({
  ASC: "asc",
  DESC: "desc",
} as const);

export type SortOrder =
  (typeof SORT_ORDER)[keyof typeof SORT_ORDER];

/* -------------------------------------------------------------------------- */
/* HTTP                                                                     */
/* -------------------------------------------------------------------------- */

export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const);

export type HttpStatusCode =
  (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

/* -------------------------------------------------------------------------- */
/* Cache                                                                     */
/* -------------------------------------------------------------------------- */

export const CACHE_KEYS = Object.freeze({
  DASHBOARD: "dashboard",
  ANALYTICS: "analytics",
  USERS: "users",
  USER: "user",
  TICKETS: "tickets",
  TICKET: "ticket",
} as const);

export const CACHE_TTL = Object.freeze({
  SHORT: 60,
  MEDIUM: 300,
  LONG: 3600,
} as const);

/* -------------------------------------------------------------------------- */
/* Queue System                                                             */
/* -------------------------------------------------------------------------- */

export const QUEUE_NAMES = Object.freeze({
  EMAILS: "emails",
  NOTIFICATIONS: "notifications",
  SLA: "sla",
  ANALYTICS: "analytics",
  WEBHOOKS: "webhooks",
} as const);

/* -------------------------------------------------------------------------- */
/* Notifications                                                            */
/* -------------------------------------------------------------------------- */

export const NOTIFICATION_CHANNELS = Object.freeze({
  EMAIL: "email",
  SLACK: "slack",
  DISCORD: "discord",
  TEAMS: "teams",
  WEBHOOK: "webhook",
} as const);

/* -------------------------------------------------------------------------- */
/* Socket                                                                    */
/* -------------------------------------------------------------------------- */

export const SOCKET_NAMESPACES = Object.freeze({
  TICKETS: "/tickets",
  NOTIFICATIONS: "/notifications",
  ANALYTICS: "/analytics",
} as const);

/* -------------------------------------------------------------------------- */
/* Audit                                                                     */
/* -------------------------------------------------------------------------- */

export const AUDIT_ACTIONS = Object.freeze({
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  LOGIN: "login",
  LOGOUT: "logout",
  EXPORT: "export",
} as const);

/* -------------------------------------------------------------------------- */
/* System Health                                                            */
/* -------------------------------------------------------------------------- */

export const HEALTH_STATUS = Object.freeze({
  OK: "ok",
  DEGRADED: "degraded",
  DOWN: "down",
} as const);

/* -------------------------------------------------------------------------- */
/* File Upload                                                             */
/* -------------------------------------------------------------------------- */

export const FILE_UPLOAD = Object.freeze({
  MAX_SIZE: 10 * 1024 * 1024,
  MAX_FILES: 5,

  ALLOWED_IMAGE_TYPES: [
    "image/jpeg",
    "image/png",
    "image/webp",
  ] as const,

  ALLOWED_DOCUMENT_TYPES: [
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ] as const,
} as const);

/* -------------------------------------------------------------------------- */
/* Validation Regex                                                         */
/* -------------------------------------------------------------------------- */

export const REGEX = Object.freeze({
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  OBJECT_ID: /^[0-9a-fA-F]{24}$/,
} as const);

/* -------------------------------------------------------------------------- */
/* Defaults                                                                 */
/* -------------------------------------------------------------------------- */

export const DEFAULTS = Object.freeze({
  USER_ROLE: USER_ROLES.AGENT,
  TICKET_PRIORITY: TICKET_PRIORITY.MEDIUM,
  TICKET_STATUS: TICKET_STATUS.OPEN,
} as const);

/* -------------------------------------------------------------------------- */
/* Derived Lists                                                           */
/* -------------------------------------------------------------------------- */

export const LISTS = Object.freeze({
  TICKET_STATUS: Object.values(TICKET_STATUS),
  TICKET_PRIORITY: Object.values(TICKET_PRIORITY),
  USER_ROLES: Object.values(USER_ROLES),
} as const);