
import { EventEmitter } from "events";
import type { ImapFlow } from "imapflow";

/* -------------------------------------------------------------------------- */
/* SAFE IMAP OPTIONS                                                          */
/* -------------------------------------------------------------------------- */

export interface SafeImapOptions {
  client: ImapFlow;
}

/* -------------------------------------------------------------------------- */
/* SAFE IMAP STATE MACHINE                                                   */
/* -------------------------------------------------------------------------- */

type SafeImapState = "idle" | "running" | "stopping";

/* -------------------------------------------------------------------------- */
/* SAFE IMAP WRAPPER (INFRA LAYER ONLY)                                      */
/* -------------------------------------------------------------------------- */

export class SafeImap extends EventEmitter {
  private readonly client: ImapFlow;

  private state: SafeImapState = "idle";

  /**
   * Ensures only ONE IMAP operation runs at a time
   */
  private inFlight = false;

  /**
   * If events fire during execution, we trigger one re-run after completion
   */
  private dirty = false;

  constructor(options: SafeImapOptions) {
    super();
    this.client = options.client;
  }

  /* ---------------------------------------------------------------------- */
  /* START                                                                  */
  /* ---------------------------------------------------------------------- */

  async start(): Promise<void> {
    if (this.state !== "idle") return;

    this.state = "running";
    this.emit("connected");
  }

  /* ---------------------------------------------------------------------- */
  /* SINGLE-FLIGHT EXECUTION CORE                                           */
  /* ---------------------------------------------------------------------- */

  async runExclusive(task: () => Promise<void>): Promise<void> {
    if (this.state !== "running") return;

    // If already running, mark dirty and exit safely
    if (this.inFlight) {
      this.dirty = true;
      return;
    }

    this.inFlight = true;

    try {
      await task();

      /**
       * If any event triggered during execution,
       * run ONE more cycle (prevents burst loss without recursion storm)
       */
      do {
        this.dirty = false;
        await task();
      } while (this.dirty);
    } catch (err) {
      this.emit("error", err);
    } finally {
      this.inFlight = false;
    }
  }

  /* ---------------------------------------------------------------------- */
  /* STATE QUERIES                                                          */
  /* ---------------------------------------------------------------------- */

  isActive(): boolean {
    return this.state === "running";
  }

  isBusy(): boolean {
    return this.inFlight;
  }

  /* ---------------------------------------------------------------------- */
  /* SAFE SHUTDOWN                                                          */
  /* ---------------------------------------------------------------------- */

  async shutdown(): Promise<void> {
    if (this.state === "stopping") return;

    this.state = "stopping";

    try {
      // ImapFlow does NOT guarantee logout state fields, so we safely call only
      await this.client.logout().catch(() => undefined);

      this.emit("shutdown");
    } catch (err) {
      this.emit("error", err);
    } finally {
      this.state = "idle";
      this.inFlight = false;
      this.dirty = false;
    }
  }
}