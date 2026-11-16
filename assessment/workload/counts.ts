/** A stated quantity. A single figure has equal ends. A range keeps both ends. */
export interface QuantitySpan {
  low: number;
  high: number;
}

const SMALL: Record<string, string> = {
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  ten: '10',
  eleven: '11',
  twelve: '12',
};

export function withSmallNumbers(text: string): string {
  return text.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/gi, (word) => SMALL[word.toLowerCase()] ?? word);
}

export function formatSpan(span: QuantitySpan): string {
  return span.low === span.high ? String(span.low) : `${span.low}–${span.high}`;
}

export function isRange(span: QuantitySpan): boolean {
  return span.low !== span.high;
}

/** Reads "10", "10-15" or "10 to 15" before a noun. The first match wins, so a range is not reduced to its last number. */
export function quantityBefore(text: string, noun: string): QuantitySpan | null {
  const numbered = withSmallNumbers(text);
  const range = numbered.match(new RegExp(`\\b(\\d{1,4})\\s*(?:-|–|—|to)\\s*(\\d{1,4})\\s+${noun}\\b`, 'i'));
  if (range) {
    const first = Number(range[1]);
    const second = Number(range[2]);
    return { low: Math.min(first, second), high: Math.max(first, second) };
  }
  const single = numbered.match(new RegExp(`\\b(\\d{1,4})\\s+${noun}\\b`, 'i'));
  if (!single) return null;
  const value = Number(single[1]);
  return { low: value, high: value };
}

/** A meeting quantity. "10–15 meetings" and "10–15 arranged" are both ranges when the message is about meetings. */
export function meetingQuantity(text: string): QuantitySpan | null {
  const direct = quantityBefore(text, 'meetings?');
  if (direct) return direct;
  const numbered = withSmallNumbers(text);
  const loose = numbered.match(/\b(\d{1,4})\s+(?:[a-z]+\s+){1,3}meetings?\b/i);
  if (loose) {
    const value = Number(loose[1]);
    return { low: value, high: value };
  }
  if (!/\bmeetings?\b/i.test(numbered)) return null;
  const range = numbered.match(/\b(\d{1,4})\s*(?:-|–|—|to)\s*(\d{1,4})\b(?!\s+hours?\b)/i);
  if (!range || range.index == null) return null;
  const window = numbered.slice(Math.max(0, range.index - 48), range.index + range[0].length + 32);
  if (!/\b(meetings?|arrang\w+|booked|weekly)\b/i.test(window)) return null;
  const first = Number(range[1]);
  const second = Number(range[2]);
  return { low: Math.min(first, second), high: Math.max(first, second) };
}
/** Reads a span already stored as "about 10–15 meetings" or "about 12 meetings". A sentence that says the share was not confirmed is not a managed count. */
export function storedSpan(evidence: string, noun: string): QuantitySpan | null {
  const sentences = evidence.split(/(?<=\.)\s+/);
  for (const sentence of sentences) {
    if (/not confirmed/i.test(sentence)) continue;
    const match = sentence.match(new RegExp(`about (\\d+)(?:–(\\d+))? ${noun}`, 'i'));
    if (!match) continue;
    const low = Number(match[1]);
    const high = match[2] ? Number(match[2]) : low;
    return { low, high };
  }
  return null;
}
