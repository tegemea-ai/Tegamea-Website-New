/** Approved anchors. A row applies only when its conditions match. These are not rates to extend. */

export const INBOX_BAND = { lowMinutes: 60, highMinutes: 90, minMessages: 80, maxMessages: 150 } as const;

export const INTERNAL_SCHEDULING = { meetings: 12, lowMinutes: 15, highMinutes: 20 } as const;

export const SIMPLE_EXTERNAL_MINUTES = { low: 5, high: 10 } as const;

export const COMPLEX_EXTERNAL_MINUTES = { low: 20, high: 30 } as const;

export const EXTERNAL_BATCH_MINUTES = { meetings: 12, highMinutes: 60 } as const;

/** Manual full notes: attendance plus 1.5 times the meeting length. */
export const MINUTES_DRAFTING_MULTIPLIER = 1.5;

/** Newly agreed document bands. Revisions and approvals are already inside the range. */
export const DOCUMENT_MINUTES = {
  simple: [10, 20],
  standard: [20, 45],
  complex: [45, 90],
  substantial: [120, 240],
} as const;

export type DocumentClass = keyof typeof DOCUMENT_MINUTES;
