
export interface InboundEmail {
  uid: number;
  from: string;
  /** FIX #2: Sender display name (e.g. "John Smith"). Empty string if unavailable. */
  fromName: string;
  subject: string;
  text?: string;
  html?: string;
  date: Date;
}

export interface EmailFingerprintInput {
  from: string;
  subject: string;
  date: Date;
}