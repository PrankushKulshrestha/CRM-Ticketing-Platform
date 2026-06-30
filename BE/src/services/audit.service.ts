
import mongoose from "mongoose";
import logger from "../config/logger";
import { AuditLog, AuditLogDocument } from "../models/AuditLog";
import { AUDIT_ACTIONS } from "../constants/constants";

/* -------------------------------------------------------------------------- */
/* Context                                                                    */
/* -------------------------------------------------------------------------- */

export interface AuditContext {
  userId?: string;

  action: keyof typeof AUDIT_ACTIONS;

  entity: string;
  entityId: string;

  message?: string;

  metadata?: Record<string, unknown>;

  ipAddress?: string;
  userAgent?: string;
}

/* -------------------------------------------------------------------------- */
/* Service                                                                    */
/* -------------------------------------------------------------------------- */

class AuditService {
  private async write(payload: AuditLogDocument): Promise<void> {
    try {
      await AuditLog.create(payload);

      logger.info("[AUDIT_WRITTEN]", {
        entity: payload.entity,
        entityId: payload.entityId,
        action: payload.action,
      });
    } catch (err) {
      logger.error("[AUDIT_WRITE_FAILED]", {
        error: err instanceof Error ? err.message : String(err),
        payload,
      });
    }
  }

  private build(context: AuditContext): AuditLogDocument {
    return {
      userId: context.userId
        ? new mongoose.Types.ObjectId(context.userId)
        : undefined,

      action: context.action as any,
      entity: context.entity,
      entityId: new mongoose.Types.ObjectId(context.entityId),

      message: context.message ?? "",

      metadata: context.metadata ?? {},

      ipAddress: context.ipAddress,
      userAgent: context.userAgent,

      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async log(context: AuditContext): Promise<void> {
    logger.info("[AUDIT_EVENT]", {
      entity: context.entity,
      action: context.action,
      entityId: context.entityId,
    });

    void this.write(this.build(context));
  }

  /* ---------------------------------------------------------------------- */
  /* Typed Helpers                                                          */
  /* ---------------------------------------------------------------------- */

  logCreate = (ctx: Omit<AuditContext, "action">) =>
    this.log({ ...ctx, action: AUDIT_ACTIONS.CREATE });

  logUpdate = (ctx: Omit<AuditContext, "action">) =>
    this.log({ ...ctx, action: AUDIT_ACTIONS.UPDATE });

  logDelete = (ctx: Omit<AuditContext, "action">) =>
    this.log({ ...ctx, action: AUDIT_ACTIONS.DELETE });

  logStatusChange = (ctx: Omit<AuditContext, "action">) =>
    this.log({ ...ctx, action: AUDIT_ACTIONS.STATUS_CHANGE });

  logAssign = (ctx: Omit<AuditContext, "action">) =>
    this.log({ ...ctx, action: AUDIT_ACTIONS.ASSIGN });

  logComment = (ctx: Omit<AuditContext, "action">) =>
    this.log({ ...ctx, action: AUDIT_ACTIONS.COMMENT });

  logEmailReceived = (ctx: Omit<AuditContext, "action">) =>
    this.log({ ...ctx, action: AUDIT_ACTIONS.EMAIL_RECEIVED });

  logAutoClassified = (ctx: Omit<AuditContext, "action">) =>
    this.log({ ...ctx, action: AUDIT_ACTIONS.AUTO_CLASSIFIED });

  logResolve = (ctx: Omit<AuditContext, "action">) =>
    this.log({ ...ctx, action: AUDIT_ACTIONS.RESOLVE });

  logReopen = (ctx: Omit<AuditContext, "action">) =>
    this.log({ ...ctx, action: AUDIT_ACTIONS.REOPEN });
}

export const auditService = new AuditService();