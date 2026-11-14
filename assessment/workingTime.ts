import type { ActiveWorkingTime, TopicId, WorkingTimeUnit } from './types';

/**
 * Reads a working-time figure when the visitor uses a clear number and unit.
 *
 * Phase 3 should replace this with Gemini for anything less direct: word numbers,
 * "a couple of hours", negation, or a correction that does not name the unit.
 * This module must not assume a five-day week, and must not treat availability
 * ("someone needs to be reachable") as active working time.
 */

interface ParsedHours {
  amount: number;
  amountTo: number | null;
  unit: WorkingTimeUnit;
  stated: string;
  unitStated: boolean;
}

export function readWorkingTime(
  text: string,
  topic: TopicId,
  current: ActiveWorkingTime | null,
  questionId = '',
): ActiveWorkingTime | null {
  const parsed = parseWorkHours(text, topic);
  const correction = statedUnitCorrection(text);
  const days = parseWorkDays(text, questionId === 'schedule', parsed?.unit === 'day' || correction === 'day');

  if (!parsed && days == null && !correction) return null;

  if (!parsed && correction && current) {
    const phrase = correction === 'day' ? 'per day' : 'per week';
    return buildTime(
      current.amount,
      current.amountTo,
      correction,
      formatStated(current.amount, current.amountTo, phrase),
      correction === 'day' ? days : null,
      true,
    );
  }

  if (!parsed && days != null && current?.unit === 'day') {
    return buildTime(current.amount, current.amountTo, 'day', current.stated, days, current.unitStated);
  }

  if (!parsed || !parsed.unit) return null;

  const unit = correction ?? parsed.unit;
  let daysPerWeek: number | null = null;
  if (unit === 'day') {
    if (days != null) daysPerWeek = days;
    else if (current?.unit === 'day' && current.daysPerWeek != null && correction !== 'day') {
      daysPerWeek = current.daysPerWeek;
    }
  }

  const stated =
    correction && parsed.unit !== unit
      ? formatStated(parsed.amount, parsed.amountTo, unit === 'day' ? 'per day' : 'per week')
      : parsed.stated;
  return buildTime(parsed.amount, parsed.amountTo, unit, stated, daysPerWeek, parsed.unitStated);
}

export function sameWorkingTime(left: ActiveWorkingTime, right: ActiveWorkingTime): boolean {
  return (
    left.stated === right.stated &&
    left.unit === right.unit &&
    left.amount === right.amount &&
    left.amountTo === right.amountTo &&
    left.daysPerWeek === right.daysPerWeek &&
    left.weeklyHours === right.weeklyHours &&
    left.weeklyHoursTo === right.weeklyHoursTo &&
    left.needsClarification === right.needsClarification
  );
}

export function workingTimeChanged(before: ActiveWorkingTime | null, after: ActiveWorkingTime | null): boolean {
  if (!after) return false;
  if (!before) return true;
  return !sameWorkingTime(before, after);
}

/** Ask for days again only when a new daily figure still cannot be converted. */
export function scheduleNeedsAnotherAsk(before: ActiveWorkingTime | null, after: ActiveWorkingTime | null): boolean {
  if (!after?.needsClarification) return false;
  if (!before?.needsClarification) return true;
  return before.stated !== after.stated || before.amount !== after.amount || before.unit !== after.unit;
}

export function acknowledgeWorkingTime(before: ActiveWorkingTime | null, after: ActiveWorkingTime): string {
  const revised = before != null && !sameWorkingTime(before, after);
  const unitChanged = before != null && before.unit !== after.unit;

  if (after.unit === 'day' && after.needsClarification) {
    if (unitChanged) {
      return `I've corrected that to ${after.stated}. I haven't converted it to a weekly total, because the number of days wasn't given.`;
    }
    if (revised) {
      return `I've updated that to ${after.stated}. I haven't converted it to a weekly total, because the number of days wasn't given.`;
    }
    return `I've noted ${after.stated}. I haven't converted it to a weekly total, because the number of days wasn't given.`;
  }

  if (after.unit === 'day' && after.weeklyHours != null && after.daysPerWeek != null) {
    const weekly = formatWeekly(after);
    if (revised) {
      return `I've updated that to ${after.stated} across ${after.daysPerWeek} days, which comes to ${weekly}. That weekly figure is calculated from what you said.`;
    }
    return `I've noted ${after.stated} across ${after.daysPerWeek} days, which comes to ${weekly}. That weekly figure is calculated from what you said.`;
  }

  if (unitChanged) return `I've corrected the active working time to ${after.stated}.`;
  if (revised) return `I've updated the active working time to ${after.stated}.`;
  if (!after.unitStated) {
    return `I've noted ${after.stated} of active work. The question asked about a normal week, and you didn't name the unit.`;
  }
  return `I've noted ${after.stated} of active work.`;
}

export function statedWorkingTimeDetail(time: ActiveWorkingTime, revised: boolean): string {
  const updated = revised ? ' (updated)' : '';
  if (time.unitStated) return `${time.stated}${updated}`;
  return `${time.stated}${updated}. The unit was not stated; it was taken as a week because the question asked about a normal week.`;
}

export function calculatedWeeklyDetail(time: ActiveWorkingTime): string | null {
  if (time.unit !== 'day' || time.weeklyHours == null || time.daysPerWeek == null) return null;
  return `${formatWeekly(time)}, calculated from ${time.stated} across ${time.daysPerWeek} days. This was not a separate estimate.`;
}

export function formatWeekly(time: ActiveWorkingTime): string {
  if (time.weeklyHours == null) return time.stated;
  if (time.weeklyHoursTo != null) return `${time.weeklyHours}–${time.weeklyHoursTo} hours per week`;
  return `${time.weeklyHours} hours per week`;
}

function buildTime(
  amount: number,
  amountTo: number | null,
  unit: WorkingTimeUnit,
  stated: string,
  daysPerWeek: number | null,
  unitStated: boolean,
): ActiveWorkingTime {
  if (unit === 'week') {
    return {
      stated,
      amount,
      amountTo,
      unit,
      unitStated,
      daysPerWeek: null,
      weeklyHours: amount,
      weeklyHoursTo: amountTo,
      needsClarification: false,
    };
  }

  const days = daysPerWeek != null && daysPerWeek >= 1 && daysPerWeek <= 7 ? daysPerWeek : null;
  return {
    stated,
    amount,
    amountTo,
    unit,
    unitStated,
    daysPerWeek: days,
    weeklyHours: days == null ? null : amount * days,
    weeklyHoursTo: days == null || amountTo == null ? null : amountTo * days,
    needsClarification: days == null,
  };
}

function parseWorkHours(text: string, topic: TopicId): ParsedHours | null {
  const explicit = [...text.matchAll(explicitHoursPattern())];
  if (explicit.length) {
    const usable = explicit.filter((match) => mentionsWorkTime(text, match.index ?? 0, topic));
    if (usable.length) {
      const correction = statedUnitCorrection(text);
      const preferred = correction
        ? [...usable].reverse().find((match) => normaliseUnit(match[3]) === correction)
        : undefined;
      return toParsed(preferred ?? usable[usable.length - 1], true);
    }
  }

  if (topic !== 'workload') return null;
  const bare = [...text.matchAll(bareHoursPattern())].filter((match) => mentionsWorkTime(text, match.index ?? 0, topic));
  const match = bare[bare.length - 1];
  if (!match) return null;
  const parsed = toParsed(match, false);
  return parsed ? { ...parsed, unit: 'week', stated: formatStated(parsed.amount, parsed.amountTo, 'per week'), unitStated: false } : null;
}

function toParsed(match: RegExpMatchArray, unitStated: boolean): ParsedHours | null {
  const amount = Number(match[1]);
  const amountTo = match[2] ? Number(match[2]) : null;
  if (!Number.isInteger(amount) || amount < 0 || amount > 80) return null;
  if (amountTo != null && (!Number.isInteger(amountTo) || amountTo < amount || amountTo > 80)) return null;
  const unit = unitStated ? normaliseUnit(match[3]) : 'week';
  const stated = unitStated ? match[0].replace(/\s+/g, ' ').trim() : formatStated(amount, amountTo, 'per week');
  return { amount, amountTo, unit, stated, unitStated };
}

function parseWorkDays(text: string, askingForDays: boolean, alongsideDailyHours: boolean): number | null {
  const explicit = text.match(/\b(\d{1,2})\s*days?\s*(?:a|per|each|\/)\s*week\b/i);
  if (explicit) {
    const count = Number(explicit[1]);
    if (count >= 1 && count <= 7) return count;
  }

  if (askingForDays) {
    const only = text.match(/^\s*(\d{1,2})\s*(?:days?)?\s*\.?$/i);
    if (only) {
      const count = Number(only[1]);
      if (count >= 1 && count <= 7) return count;
    }
  }

  const named = namedDaysPerWeek(text);
  if (named == null) return null;
  if (askingForDays || alongsideDailyHours) return named;
  return null;
}

function namedDaysPerWeek(text: string): number | null {
  if (/\bmonday\s*(?:to|–|-)\s*friday\b|\bweekdays\b|\bmon(?:day)?\s*[-–]\s*fri(?:day)?\b/i.test(text)) return 5;
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].filter((day) =>
    new RegExp(`\\b${day}\\b`, 'i').test(text),
  );
  if (days.length >= 2) return days.length;
  return null;
}

export function statedUnitCorrection(text: string): WorkingTimeUnit | null {
  const rejectsWeek = /\bnot\s+(?:a|per|each|\/)\s*week\b|\bnot\s+weekly\b/i.test(text);
  const rejectsDay = /\bnot\s+(?:a|per|each|\/)\s*day\b|\bnot\s+daily\b/i.test(text);
  const saysDay = /\b(?:a|per|each|\/)\s*day\b|\bdaily\b/i.test(text);
  const saysWeek = /\b(?:a|per|each|\/)\s*week\b|\bweekly\b/i.test(text);
  if (saysDay && rejectsWeek && !rejectsDay) return 'day';
  if (saysWeek && rejectsDay && !rejectsWeek) return 'week';
  return null;
}

function mentionsWorkTime(text: string, index: number, topic: TopicId): boolean {
  if (statedUnitCorrection(text)) return true;
  const before = text.slice(Math.max(0, index - 42), index);
  const nearest = nearestCue(before);
  if (nearest === 'availability') return false;
  if (nearest === 'work') return true;
  const after = text.slice(index, Math.min(text.length, index + 28));
  if (/\b(available|availability|reachable|cover(?:ing)?)\b/i.test(after) && !/\b(work|tasks?|admin|support)\b/i.test(after)) {
    return false;
  }
  if (/\b(work|tasks?|admin|support)\b/i.test(after)) return true;
  return topic === 'workload';
}

function nearestCue(before: string): 'work' | 'availability' | null {
  let kind: 'work' | 'availability' | null = null;
  let at = -1;
  const pattern = /\b(available|availability|reachable|cover(?:ing)?|work|tasks?|spend(?:ing)?|takes|taking|admin|doing|active|support)\b/gi;
  for (const match of before.matchAll(pattern)) {
    const word = match[1].toLowerCase();
    const next = /available|availability|reachable|cover/.test(word) ? 'availability' : 'work';
    const index = match.index ?? -1;
    if (index >= at) {
      at = index;
      kind = next;
    }
  }
  return kind;
}

export function workingTimeFromParts(parts: {
  amount: number;
  amountTo?: number | null;
  unit: WorkingTimeUnit;
  daysPerWeek?: number | null;
  unitStated?: boolean;
}): ActiveWorkingTime {
  const phrase = parts.unit === 'day' ? 'per day' : 'per week';
  return buildTime(
    parts.amount,
    parts.amountTo ?? null,
    parts.unit,
    formatStated(parts.amount, parts.amountTo ?? null, phrase),
    parts.daysPerWeek ?? null,
    parts.unitStated !== false,
  );
}

function formatStated(amount: number, amountTo: number | null, unitPhrase: string): string {
  const figure = amountTo == null ? `${amount}` : `${amount}–${amountTo}`;
  return `${figure} hours ${unitPhrase}`;
}

function normaliseUnit(raw: string | undefined): WorkingTimeUnit {
  return raw?.toLowerCase().startsWith('w') ? 'week' : 'day';
}

function explicitHoursPattern(): RegExp {
  return /\b(\d{1,2})(?:\s*(?:-|–|to)\s*(\d{1,2}))?\s*(?:hours?|hrs?)\s*(?:(?:a|per|each|\/)\s*)?(day|week|daily|weekly)\b/gi;
}

function bareHoursPattern(): RegExp {
  return /\b(\d{1,2})(?:\s*(?:-|–|to)\s*(\d{1,2}))?\s*(?:hours?|hrs?)\b/gi;
}
