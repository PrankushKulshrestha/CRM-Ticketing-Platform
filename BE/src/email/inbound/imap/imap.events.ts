
export interface ImapNewMailEvent {
  uid: number;
  mailbox: string;

  seq?: number;
  messageId?: string;

  internalDate?: Date;
}

/* -------------------------------------------------------------------------- */
/* EVENT TYPES                                                               */
/* -------------------------------------------------------------------------- */

export type ImapEventType =
  | "mail:new"
  | "mail:expunge"
  | "connection:lost"
  | "connection:reconnected"
  | "connection:reconnecting"
  | "mail:idle-trigger";

/* -------------------------------------------------------------------------- */
/* CORE EVENT WRAPPER (STRICT + UNIFIED)                                     */
/* -------------------------------------------------------------------------- */

export interface ImapEvent<T = unknown> {
  type: ImapEventType;
  payload: T;
  timestamp: Date;
}

/* -------------------------------------------------------------------------- */
/* EVENT HANDLER                                                             */
/* -------------------------------------------------------------------------- */

export type ImapEventHandler<T = unknown> = (
  event: ImapEvent<T>,
) => void | Promise<void>;

/* -------------------------------------------------------------------------- */
/* EVENT MAP (TYPE SAFE DISPATCH LAYER)                                      */
/* -------------------------------------------------------------------------- */

export interface ImapEventMap {
  "mail:new": ImapNewMailEvent;
  "mail:expunge": ImapNewMailEvent;

  "connection:lost": void;
  "connection:reconnected": void;

  "connection:reconnecting": { attempt: number };

  "mail:idle-trigger": void;
}