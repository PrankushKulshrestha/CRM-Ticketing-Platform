/**
 * Keyword-based ticket category classifier.
 *
 * Maps an inbound email's subject + body to a (cat_id, sub_cat_id) pair on
 * the Ticket schema. cat_id/sub_cat_id/sub_sub_cat_id have always been
 * free-text strings with no backing taxonomy or model — there was no
 * category list anywhere in the codebase to classify against. This file
 * IS that taxonomy: a deliberately editable keyword dictionary, plus a
 * small scoring engine that picks the best match instead of a brittle
 * first-keyword-wins check.
 *
 * To add/edit categories: only CATEGORY_KEYWORDS below needs to change.
 * Nothing else in this file or in inbound.worker.ts needs to know about
 * specific categories.
 */

/* -------------------------------------------------------------------------- */
/* TAXONOMY — edit this to change what tickets get classified as            */
/* -------------------------------------------------------------------------- */

export interface CategoryDefinition {
  /** Stored verbatim into Ticket.cat_id. */
  catId: string;
  /** Stored verbatim into Ticket.sub_cat_id. */
  subCatId: string;
  /**
   * Keywords/phrases that count as evidence for this category. Multi-word
   * phrases are matched as substrings (e.g. "can't login" matches inside
   * "I can't login to my account"), so prefer specific phrases over
   * single common words where possible to avoid false positives.
   */
  keywords: string[];
  /**
   * Per-category score multiplier. Use this to make a narrow,
   * high-confidence category (e.g. "Billing > Refund Request") win over
   * a broad one even with fewer keyword hits, or to de-rank a category
   * prone to false positives. Defaults to 1 if omitted.
   */
  weight?: number;
}

export const CATEGORY_KEYWORDS: CategoryDefinition[] = [
  // ---- Billing -------------------------------------------------------
  {
    catId: "Billing",
    subCatId: "Refund Request",
    keywords: [
      "refund",
      "money back",
      "reverse the charge",
      "chargeback",
      "want my money back",
    ],
    weight: 1.3,
  },
  {
    catId: "Billing",
    subCatId: "Invoice / Receipt",
    keywords: ["invoice", "receipt", "billing statement", "tax invoice", "gst invoice"],
  },
  {
    catId: "Billing",
    subCatId: "Subscription / Plan",
    keywords: [
      "subscription",
      "cancel my plan",
      "upgrade plan",
      "downgrade plan",
      "renewal",
      "auto-renew",
      "billing cycle",
    ],
  },
  {
    catId: "Billing",
    subCatId: "Payment Failed",
    keywords: [
      "payment failed",
      "card declined",
      "payment did not go through",
      "double charged",
      "charged twice",
      "incorrect charge",
    ],
    weight: 1.2,
  },

  // ---- Technical / Product --------------------------------------------
  {
    catId: "Technical",
    subCatId: "Login / Access",
    keywords: [
      "can't login",
      "cannot login",
      "can't log in",
      "unable to login",
      "locked out",
      "forgot password",
      "reset password",
      "2fa",
      "two-factor",
      "account locked",
    ],
    weight: 1.2,
  },
  {
    catId: "Technical",
    subCatId: "Bug / Error",
    keywords: [
      "error message",
      "not working",
      "broken",
      "crash",
      "crashed",
      "bug",
      "glitch",
      "stack trace",
      "500 error",
      "404",
      "exception",
    ],
  },
  {
    catId: "Technical",
    subCatId: "Performance",
    keywords: [
      "slow",
      "lagging",
      "timeout",
      "timed out",
      "taking too long",
      "freezing",
      "unresponsive",
    ],
  },
  {
    catId: "Technical",
    subCatId: "Integration / API",
    keywords: [
      "api key",
      "webhook",
      "integration",
      "api error",
      "rate limit",
      "endpoint",
      "api documentation",
    ],
  },

  // ---- Account ----------------------------------------------------------
  {
    catId: "Account",
    subCatId: "Account Setup",
    keywords: [
      "create an account",
      "sign up",
      "onboarding",
      "verify my email",
      "verification email",
      "activate my account",
    ],
  },
  {
    catId: "Account",
    subCatId: "Account Deletion",
    keywords: [
      "delete my account",
      "close my account",
      "remove my data",
      "gdpr",
      "right to be forgotten",
    ],
    weight: 1.3,
  },
  {
    catId: "Account",
    subCatId: "Profile / Settings",
    keywords: [
      "update my profile",
      "change my email",
      "change my name",
      "account settings",
      "notification settings",
    ],
  },

  // ---- Sales / Pre-sales --------------------------------------------------
  {
    catId: "Sales",
    subCatId: "Pricing Inquiry",
    keywords: [
      "pricing",
      "how much does it cost",
      "price quote",
      "quote for",
      "enterprise pricing",
      "discount",
    ],
  },
  {
    catId: "Sales",
    subCatId: "Demo Request",
    keywords: ["demo", "schedule a call", "book a call", "product walkthrough"],
  },
  {
    catId: "Sales",
    subCatId: "Partnership",
    keywords: ["partnership", "reseller", "affiliate program", "collaborate"],
  },

  // ---- Complaint ----------------------------------------------------------
  {
    catId: "Complaint",
    subCatId: "Service Complaint",
    keywords: [
      "complaint",
      "very disappointed",
      "unacceptable",
      "terrible service",
      "worst experience",
      "extremely unhappy",
    ],
    weight: 1.4,
  },
  {
    catId: "Complaint",
    subCatId: "Staff Conduct",
    keywords: ["rude", "unprofessional", "spoke to me badly", "treated me poorly"],
    weight: 1.4,
  },

  // ---- General / feedback --------------------------------------------------
  {
    catId: "Feedback",
    subCatId: "Feature Request",
    keywords: [
      "feature request",
      "would be great if",
      "suggestion",
      "it would be nice",
      "please add",
    ],
  },
  {
    catId: "Feedback",
    subCatId: "General Feedback",
    keywords: ["feedback", "just wanted to say", "love the product", "great job"],
  },
];

/** Returned when no category clears MIN_SCORE_THRESHOLD. */
export const UNCATEGORIZED: { catId: string; subCatId: string } = {
  catId: "Uncategorized",
  subCatId: "Uncategorized",
};

/* -------------------------------------------------------------------------- */
/* SCORING ENGINE                                                             */
/* -------------------------------------------------------------------------- */

/**
 * A match in the subject line is stronger evidence than the same word
 * showing up somewhere in a long body, so subject hits are weighted up.
 */
const SUBJECT_HIT_WEIGHT = 2;
const BODY_HIT_WEIGHT = 1;

/**
 * Minimum accumulated score before we trust a category enough to assign
 * it automatically. Below this, an email matched only weakly/incidentally
 * (e.g. one common word appearing once in a long email) and is left
 * Uncategorized for a human to triage, rather than confidently mislabeling
 * it. Tune this up if too many emails get auto-categorized on thin
 * evidence; tune it down if too many legitimate matches get left
 * Uncategorized.
 */
const MIN_SCORE_THRESHOLD = 2;

export interface ClassificationResult {
  catId: string;
  subCatId: string;
  /** Raw accumulated score for the winning category — useful for logging/debugging. */
  score: number;
  /**
   * Every category that scored above zero, sorted best-first. Lets the
   * caller log "this was a close call between Billing and Complaint" type
   * detail without re-running the scorer.
   */
  candidates: Array<{ catId: string; subCatId: string; score: number }>;
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let idx = haystack.indexOf(needle);
  while (idx !== -1) {
    count += 1;
    idx = haystack.indexOf(needle, idx + needle.length);
  }
  return count;
}

/**
 * Scores every category against the given subject/body and returns the
 * single best match, falling back to UNCATEGORIZED if nothing clears the
 * confidence threshold. Conflicts (multiple categories with meaningful
 * scores — e.g. an email that's both a billing question AND a complaint)
 * are resolved purely by score, with the per-category `weight` letting
 * the taxonomy express "this category should win ties" without hacking
 * the scoring loop itself.
 */
export function classifyTicketCategory(
  subject: string,
  body: string,
): ClassificationResult {
  const subjectLower = (subject || "").toLowerCase();
  const bodyLower = (body || "").toLowerCase();

  const scored = CATEGORY_KEYWORDS.map((def) => {
    let raw = 0;
    for (const keyword of def.keywords) {
      const kw = keyword.toLowerCase();
      raw += countOccurrences(subjectLower, kw) * SUBJECT_HIT_WEIGHT;
      raw += countOccurrences(bodyLower, kw) * BODY_HIT_WEIGHT;
    }
    const score = raw * (def.weight ?? 1);
    return { catId: def.catId, subCatId: def.subCatId, score };
  })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  const winner = scored[0];

  if (!winner || winner.score < MIN_SCORE_THRESHOLD) {
    return {
      ...UNCATEGORIZED,
      score: winner?.score ?? 0,
      candidates: scored,
    };
  }

  return {
    catId: winner.catId,
    subCatId: winner.subCatId,
    score: winner.score,
    candidates: scored,
  };
}
