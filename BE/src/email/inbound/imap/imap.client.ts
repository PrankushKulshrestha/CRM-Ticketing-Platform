
import type { ImapFlow, FetchMessageObject } from "imapflow";
import type { ImapClientContext, NormalizedEmail } from "./imap.types";

export class ImapClient {
  private readonly client: ImapFlow;
  private readonly defaultMailbox: string;
  private connected = false;

  constructor(ctx: ImapClientContext) {
    this.client = ctx.client;
    this.defaultMailbox = ctx.mailbox ?? "INBOX";
  }

  /* -------------------------------------------------------------------------- */
  /* MAILBOX OPEN                                                              */
  /* -------------------------------------------------------------------------- */

  async openMailbox(mailbox?: string): Promise<void> {
    const target = mailbox ?? this.defaultMailbox;
    await this.client.mailboxOpen(target);
    this.connected = true;
  }

  /* -------------------------------------------------------------------------- */
  /* INCREMENTAL SEARCH                                                        */
  /* -------------------------------------------------------------------------- */

  async searchSinceUid(lastUid: number): Promise<number[]> {
    if (!lastUid || lastUid < 1) return [];

    // imapflow v1.x search() return type is number[] — guard for older typedefs
    const result: unknown = await this.client.search({ uid: `${lastUid + 1}:*` });

    return Array.isArray(result) ? (result as number[]) : [];
  }

  /* -------------------------------------------------------------------------- */
  /* FETCH + NORMALIZATION                                                     */
  /* -------------------------------------------------------------------------- */

  async fetch(uids: number[]): Promise<NormalizedEmail[]> {
    if (!Array.isArray(uids) || uids.length === 0) return [];

    const emails: NormalizedEmail[] = [];

    /*
     * FIX ts(2355): cast the async iterable explicitly so TS doesn't widen
     * the return type of the for-await to `unknown` and then complain that
     * the function body has no guaranteed return after the loop.
     */
    const messages = this.client.fetch(uids, {
      uid: true,
      envelope: true,
      internalDate: true,
      bodyStructure: true,
    }) as AsyncIterable<FetchMessageObject>;

    for await (const msg of messages) {
      if (!msg?.uid || !msg.envelope) continue;

      const envelope = msg.envelope;

      const from     = this.extractAddress(envelope.from?.[0]);
      // FIX #2: capture the sender's display name separately from their email address
      const fromName = this.extractDisplayName(envelope.from?.[0]);
      const to   = (envelope.to ?? [])
        .map((t) => this.extractAddress(t))
        .filter(Boolean);

      const subject = envelope.subject?.trim() || "(no subject)";
      const date    = this.normalizeDate(msg.internalDate);

      const email: NormalizedEmail = {
        uid:        msg.uid,
        messageId:  envelope.messageId,
        from,
        fromName,
        to,
        subject,
        date,
        inReplyTo:  envelope.inReplyTo ?? undefined,
        references: undefined,
      };

      emails.push(email);
    }

    return emails;
  }

  /* -------------------------------------------------------------------------- */
  /* FETCH SINGLE                                                              */
  /* -------------------------------------------------------------------------- */

  async fetchByUid(uid: number): Promise<NormalizedEmail | null> {
    const result = await this.fetch([uid]);
    return result[0] ?? null;
  }

  /* -------------------------------------------------------------------------- */
  /* STATE                                                                     */
  /* -------------------------------------------------------------------------- */

  isConnected(): boolean {
    return this.connected;
  }

  /* -------------------------------------------------------------------------- */
  /* PRIVATE HELPERS                                                           */
  /* -------------------------------------------------------------------------- */

  private extractAddress(
    person?: { address?: string; name?: string } | null,
  ): string {
    if (!person) return "";
    return person.address || person.name || "";
  }

  /**
   * FIX #2: Returns the display name if the email envelope has one,
   * otherwise falls back to the email address. This is used so that
   * tkt_customer_name stores "John Smith" rather than "john.smith@..."
   */
  private extractDisplayName(
    person?: { address?: string; name?: string } | null,
  ): string {
    if (!person) return "";
    const name = person.name?.trim();
    if (name && name.length > 0) return name;
    return person.address || "";
  }

  private normalizeDate(value: unknown): Date {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    const d = new Date(value as string | number);
    return isNaN(d.getTime()) ? new Date() : d;
  }
}