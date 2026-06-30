
/* -------------------------------------------------------------------------- */
/* Core App Constants                                                         */
/* -------------------------------------------------------------------------- */

/* Pagination */
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;
export const MAX_EXPORT_LIMIT = 5000;

/* Auth */
export const PASSWORD_MIN_LENGTH = 8;

/* Ticket Number */
export const TICKET_NUMBER_PREFIX = "TCK";

/* -------------------------------------------------------------------------- */
/* Ticket Status                                                             */
/* -------------------------------------------------------------------------- */

export const TICKET_STATUS = {
  NEW: "new",
  OPEN: "open",
  PENDING: "pending",
  REOPENED: "reopened",
  REQUEST_CLARIFICATION: "request_clarification",
  RESOLVED: "resolved",
  CLOSED: "closed",
} as const;

export type TicketStatus =
  (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];

/* -------------------------------------------------------------------------- */
/* Ticket Classification                                                      */
/* -------------------------------------------------------------------------- */

export const TICKET_CLASSIFICATION = {
  GENERAL: "General",
  COMPLAINT: "Complaint",
  REQUEST: "Request",
  INCIDENT: "Incident",
  SERVICE: "Service",
} as const;

export type TicketClassification =
  (typeof TICKET_CLASSIFICATION)[keyof typeof TICKET_CLASSIFICATION];

/* -------------------------------------------------------------------------- */
/* PRIORITY (STANDARDIZED STRING MODEL FOR EMAIL + TICKETS)                  */
/* -------------------------------------------------------------------------- */

export const PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
} as const;

export type TicketPriority =
  (typeof PRIORITY)[keyof typeof PRIORITY];

/* -------------------------------------------------------------------------- */
/* Roles                                                                      */
/* -------------------------------------------------------------------------- */

export const USER_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  AGENT: "agent",
} as const;

export type UserRole =
  (typeof USER_ROLES)[keyof typeof USER_ROLES];

/* -------------------------------------------------------------------------- */
/* Permissions                                                                */
/* -------------------------------------------------------------------------- */

export const PERMISSIONS = {
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
} as const;

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/* -------------------------------------------------------------------------- */
/* Audit Actions                                                             */
/* -------------------------------------------------------------------------- */

export const AUDIT_ACTIONS = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  EXPORT: "EXPORT",
  STATUS_CHANGE: "STATUS_CHANGE",
  ASSIGN: "ASSIGN",
  COMMENT: "COMMENT",
  EMAIL_RECEIVED: "EMAIL_RECEIVED",
  EMAIL_REPLY_RECEIVED: "EMAIL_REPLY_RECEIVED",
  AUTO_CLASSIFIED: "AUTO_CLASSIFIED",
  REOPEN: "REOPEN",
  RESOLVE: "RESOLVE",
  MERGE: "MERGE",
} as const;

export type AuditAction =
  (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

/* -------------------------------------------------------------------------- */
/* HTTP STATUS                                                                */
/* -------------------------------------------------------------------------- */

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type HttpStatusCode =
  (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];