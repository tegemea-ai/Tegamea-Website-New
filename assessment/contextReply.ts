/**
 * Reads a short reply against the immediately previous assistant question.
 * Examples from earlier turns are not reused.
 */

export interface ConfirmedOffer {
  kind: 'confirmed';
  phrases: string[];
  executive: string[];
  project: string[];
}

export interface AmbiguousOffer {
  kind: 'ambiguous';
}

export type ContextReading = ConfirmedOffer | AmbiguousOffer;

const SMALL: Record<string, number> = { one: 1, two: 2, three: 3, four: 4 };

export function interpretReply(priorAssistant: string, visitor: string): ContextReading | null {
  if (!isReferential(visitor)) return null;
  const items = offeredItems(priorAssistant);
  if (!items.length) return { kind: 'ambiguous' };
  const selected = selectItems(items, visitor);
  if (!selected) return { kind: 'ambiguous' };
  const executive: string[] = [];
  const project: string[] = [];
  for (const phrase of selected) {
    for (const label of executiveLabels(phrase)) push(executive, label);
    for (const label of projectLabels(phrase)) push(project, label);
  }
  if (!executive.length && !project.length) return { kind: 'ambiguous' };
  return { kind: 'confirmed', phrases: selected, executive, project };
}

function isReferential(text: string): boolean {
  const value = text.trim();
  if (/^(yes[,.]?\s+)?(to\s+)?all(\s+of)?(\s+(that|those|them|this|it))?[.!]?$/i.test(value)) return true;
  if (/^(all of (those|them|that|it)|everything)[.!]?$/i.test(value)) return true;
  if (/^yes[,.]?\s+exactly[.!]?$/i.test(value)) return true;
  if (/\bexcept\b/i.test(value) && /\b(everything|all|those|them)\b/i.test(value)) return true;
  if (/^(just |only )?the first\b/i.test(value)) return true;
  if (/^the (second|third|last)\b/i.test(value)) return true;
  return false;
}

/** Examples and “help with A, B or C” lists in one assistant message. */
export function offeredItems(message: string): string[] {
  const example = message.match(/for example,?\s+([^?\n]+)/i);
  const help = message.match(/\b(?:help with|such as|including)\s+([^?\n]+)/i);
  const source = (example?.[1] ?? help?.[1] ?? '').replace(/[.”"]?\s*$/g, '').trim();
  if (!source) return [];
  return source
    .split(/\s*,\s*/)
    .flatMap((part) => part.split(/\s+\bor\b\s+/i))
    .map((part) => part.replace(/^(and|or)\s+/i, '').replace(/[.]+$/g, '').trim())
    .filter((part) => part.length > 2);
}

function selectItems(items: string[], visitor: string): string[] | null {
  const exclusion = visitor.match(/\bexcept\s+(.+?)[.!]?$/i);
  if (exclusion) {
    const kept = items.filter((item) => !overlaps(item, exclusion[1]));
    return kept.length ? kept : null;
  }
  const count = visitor.match(/\bfirst\s+(one|two|three|four|\d+)\b/i);
  if (count) {
    const amount = SMALL[count[1].toLowerCase()] ?? Number(count[1]);
    if (!Number.isFinite(amount) || amount < 1 || amount > items.length) return null;
    return items.slice(0, amount);
  }
  if (/\bthe last\b/i.test(visitor)) return [items[items.length - 1]];
  const single = visitor.match(/\bthe (first|second|third)\b/i);
  if (single && !/\bfirst\s+(one|two|three|four|\d+)\b/i.test(visitor)) {
    const index = { first: 0, second: 1, third: 2 }[single[1].toLowerCase()] ?? -1;
    return items[index] ? [items[index]] : null;
  }
  return items;
}

function overlaps(item: string, exclusion: string): boolean {
  const words = exclusion.toLowerCase().match(/\b[a-z]{4,}\b/g) ?? [];
  const haystack = item.toLowerCase();
  return words.some((word) => haystack.includes(word.slice(0, Math.min(word.length, 6))));
}

function executiveLabels(phrase: string): string[] {
  const labels: string[] = [];
  if (/\binbox\b|\bemails?\b/i.test(phrase)) labels.push('Inbox management');
  if (/\b(diary|calendar)\b/i.test(phrase)) labels.push('Diary management', 'Scheduling');
  if (/\b(schedul\w*|arranging|coordinating meetings)\b/i.test(phrase)) labels.push('Scheduling', 'Diary management');
  if (/\bclients?\b/i.test(phrase)) labels.push('Client meeting coordination');
  if (/\bdocuments?\b/i.test(phrase)) labels.push('Document preparation');
  return labels;
}

function projectLabels(phrase: string): string[] {
  const labels: string[] = [];
  if (/\bfollow(?:ing)?\s+up\b|\bactions?\b/i.test(phrase)) labels.push('Chasing and follow-up');
  if (/\bactions?\b/i.test(phrase)) labels.push('Action tracking');
  return labels;
}

function push(list: string[], label: string): void {
  if (!list.includes(label)) list.push(label);
}
