import SystemSettingsModel, {
  type ISystemSettings,
} from "../models/SystemSettings";
import TicketModel from "../models/Ticket";
import { TICKET_STATUS } from "../constants/constants";
import type mongoose from "mongoose";

/* -------------------------------------------------------------------------- */
/* In-process cache — avoids a DB hit on every ticket creation                */
/* -------------------------------------------------------------------------- */

let _cache: ISystemSettings | null = null;
let _cacheAt = 0;
const CACHE_TTL_MS = 60_000; // re-fetch from DB at most once per minute

async function fetchFresh(): Promise<ISystemSettings> {
  let doc = await SystemSettingsModel.findOne({ _singleton: "global" }).lean<ISystemSettings | null>();
  if (!doc) {
    doc = (
      await SystemSettingsModel.create({ _singleton: "global" })
    ).toObject() as ISystemSettings;
  }
  _cache = doc;
  _cacheAt = Date.now();
  return doc;
}

export async function getSettings(): Promise<ISystemSettings> {
  if (_cache && Date.now() - _cacheAt < CACHE_TTL_MS) return _cache;
  return fetchFresh();
}

export async function updateSettings(
  patch: Partial<Pick<ISystemSettings, "new_ticket_window_hours">>,
  userId?: mongoose.Types.ObjectId
): Promise<ISystemSettings> {
  const doc = await SystemSettingsModel.findOneAndUpdate(
    { _singleton: "global" },
    { ...patch, updated_by: userId ?? null },
    { new: true, upsert: true, runValidators: true }
  ).lean<ISystemSettings>();

  // Bust cache immediately
  _cache = doc;
  _cacheAt = Date.now();

  return doc;
}

/**
 * Returns true if `createdAt` falls within the "new ticket" window.
 * Used by createTicket to decide the default status.
 */
export async function isWithinNewTicketWindow(createdAt: Date): Promise<boolean> {
  const settings = await getSettings();
  const windowMs = settings.new_ticket_window_hours * 60 * 60 * 1000;
  return Date.now() - createdAt.getTime() <= windowMs;
}

/**
 * Lazily flips any ticket still marked "new" whose creation time has fallen
 * outside the admin-configured window over to "open" — the same
 * lazy-on-read pattern used for SLA evaluation, so no cron/scheduler is
 * needed. Cheap: a single indexed updateMany, safe to call on every ticket
 * list/detail read.
 */
export async function expireStaleNewTickets(): Promise<void> {
  const settings = await getSettings();
  const windowMs = settings.new_ticket_window_hours * 60 * 60 * 1000;
  const cutoff = new Date(Date.now() - windowMs);

  await TicketModel.updateMany(
    {
      tkt_status: TICKET_STATUS.NEW,
      $or: [
        { created_date: { $lte: cutoff } }, // window expired
        { tkt_assigned_to: { $ne: null } }, // assigned tickets are never "new"
      ],
    },
    { $set: { tkt_status: TICKET_STATUS.OPEN } },
  );
}
