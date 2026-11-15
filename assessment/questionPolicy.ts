import type { EssentialGap } from './coverage';
import type { AssessmentRecord } from './types';

const SAFE_CLOSE =
  "That's enough for this stage. A later phase will turn this into a recommendation. I haven't suggested how to staff it or calculated a cost.";

const BLOCKED_REPLY = /£|\$\s?\d|\bper hour\b|\bi recommend\b|\brecruitment fee\b|\bon-?costs?\b|\bsalary\b/i;

const FILLER = /^(thanks?( you)?|thank you|noted|understood|great|okay|ok|sure|got it|of course)[.!]?\s*$/i;

const PEAK_FOLLOW_UP =
  'You mentioned that group travel creates busier periods. What additional support do you typically need during those times?';

const CLOSE_QUESTION =
  "Before I put together your recommendation, is there anything else taking up your time that you'd ideally like to delegate?";

export function declinesProjects(text: string): boolean {
  return (
    /\bno specific projects\b/i.test(text) ||
    /\b(no|not|none|without)\b(?:\s+\w+){0,5}\s+projects?\b/i.test(text) ||
    /\b(do not|don't|dont)\s+have\b(?:\s+\w+){0,4}\s+projects?\b/i.test(text)
  );
}

export function affirmsProjects(text: string): boolean {
  return /\bprojects?\b/i.test(text) && !declinesProjects(text) && !/^(how|what|when|why|where|can you|could you)\b/i.test(text);
}

export function describePeak(text: string): string | null {
  if (/\bgroup travel\b/i.test(text) && /\b(peak|busier|busiest|certain points|times of year|during the year)\b/i.test(text)) {
    return 'Group travel creates busier periods during the year.';
  }
  if (/\b(peak|busier|busiest|quarter[- ]end|month[- ]end|year[- ]end)\b/i.test(text)) {
    return 'You described busier periods as well as the normal week.';
  }
  return null;
}

export function partOfDayPreference(text: string): string | null {
  if (/\btakes most of\b/i.test(text) && !/\b(available|availability|reachable|cover)\b/i.test(text)) return null;
  const lateAfternoon = /\blate afternoon\b/i.test(text);
  const parts = [
    /\bmorning\b/i.test(text) ? 'morning' : null,
    lateAfternoon ? 'late afternoon' : /\bafternoon\b/i.test(text) ? 'afternoon' : null,
    /\bevening\b/i.test(text) ? 'evening' : null,
  ].filter((part): part is string => Boolean(part));
  if (!parts.length) return null;
  const aboutAvailability = /\b(available|availability|reachable|cover|prefer|needed|need someone|in the)\b/i.test(text);
  if (!aboutAvailability && text.trim().length > 80) return null;
  return parts
    .map((part, index) => (index === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(' and ');
}

export function isPartOfDayWindow(value: string): boolean {
  return /\b(morning|afternoon|evening)\b/i.test(value) && !/\d/.test(value);
}

/** Lines the model must treat as settled. These come from the record, not from the transcript window. */
export function doNotAsk(record: AssessmentRecord): string[] {
  const lines: string[] = [];
  const time = record.workload.activeTime.value;
  if (time?.needsClarification) {
    lines.push(
      `Active working time is already ${time.stated}. Ask only how many days a week that applies to. Do not ask for the hours again, and do not turn them into a weekly total.`,
    );
  } else if (time) {
    const calculated = time.unit === 'day' && time.weeklyHours != null ? ` ${time.weeklyHours} hours per week is calculated from that, not a separate figure.` : '';
    lines.push(`Active working time is already ${time.stated}.${calculated} Do not ask for it again.`);
  }
  if ((record.project.status ?? 'unknown') === 'not_applicable') {
    lines.push('Project support is not applicable. Do not ask about projects again. Follow the peaks or other work they did describe.');
  }
  if (record.staffing.location.value) {
    lines.push(`Working arrangement is ${record.staffing.location.value}. Do not ask remote, hybrid or on-site again.`);
  }
  if (record.staffing.model.value) {
    lines.push(`Staffing preference is ${record.staffing.model.value}. Do not ask outsourced versus hiring again.`);
  }
  if (record.availability.window.value && isPartOfDayWindow(record.availability.window.value)) {
    lines.push(
      `Availability preference is ${record.availability.window.value}. Do not ask for exact start or finish times. Those can be agreed during onboarding.`,
    );
  }
  if (record.workload.peak.value) lines.push(`Peaks already noted: ${record.workload.peak.value}`);
  if (record.process.skipped) lines.push('Software and process detail was skipped or is unknown. Do not ask again.');
  for (const assumption of record.assumptions ?? []) {
    lines.push(`Provisional, not a confirmed fact: ${assumption.text}`);
  }
  return lines;
}

export function rememberedWording(record: AssessmentRecord): string {
  const lines = (record.statements ?? []).slice(-20).map((statement) => statement.text.replace(/\s+/g, ' ').trim().slice(0, 300));
  return lines.length ? lines.map((line) => `- ${line}`).join('\n') : 'None yet.';
}

type Redirect = 'hours' | 'projects' | 'clock' | 'software' | 'repeat';

export function composeAssistantReply(input: {
  message: string;
  record: AssessmentRecord;
  gap: EssentialGap | null;
  complete: boolean;
  asked: string[];
}): { text: string; asked: string[] } {
  const asked = [...input.asked];
  let text = input.message.replace(/\s+/g, ' ').trim().slice(0, 1200);
  text = text.replace(/^(?:thank you|thanks)(?:\s+for\s+(?:that|sharing(?:\s+that)?|your (?:reply|answer)))?[.!]\s+/i, '');
  const redirect = redirectReason(text, input.record);

  if (!text || BLOCKED_REPLY.test(text) || redirect) {
    text = input.complete ? SAFE_CLOSE : nextQuestion(input.record, input.gap, asked, redirect);
  }

  if (input.complete) {
    if (!/later phase/i.test(text)) text = `${text} ${SAFE_CLOSE}`.trim();
    return { text, asked };
  }

  if ((input.gap || askedNeedsClose(input.record, input.gap)) && !text.includes('?')) {
    const question = nextQuestion(input.record, input.gap, asked, null);
    text = FILLER.test(text) ? question : `${text} ${question}`.trim();
  }
  return { text, asked };
}

function askedNeedsClose(record: AssessmentRecord, gap: EssentialGap | null): boolean {
  return gap == null && (record.statements?.length ?? 0) > 0;
}

function redirectReason(message: string, record: AssessmentRecord): Redirect | null {
  if (!message.includes('?')) return null;
  if (repeatsKnownHours(message, record)) return 'hours';
  if (asksForProjects(message, record)) return 'projects';
  if (demandsClockTimes(message) && indicativeWindow(record)) return 'clock';
  if (record.process.skipped && /\b(software|systems|which tools|automation)\b/i.test(message)) return 'software';
  if ((record.executive.mentioned || record.operations.mentioned) && /\bwhich parts of the work\b/i.test(message)) return 'repeat';
  return null;
}

function repeatsKnownHours(message: string, record: AssessmentRecord): boolean {
  const time = record.workload.activeTime.value;
  if (!time) return false;
  if (time.needsClarification && /\bhow many days\b/i.test(message)) return false;
  return /\b(how much active|how many hours|active working time|per day or per week|is that per day|how long does(?: this| that)? take)\b/i.test(message);
}

function asksForProjects(message: string, record: AssessmentRecord): boolean {
  if ((record.project.status ?? 'unknown') !== 'not_applicable') return false;
  if (/\bgroup travel\b/i.test(message) && /\b(during those|additional support|busier)\b/i.test(message)) return false;
  return /\bprojects?\b/i.test(message) && /\b(do you have|are there|any other|besides|what projects|which projects|ongoing tasks)\b/i.test(message);
}

function demandsClockTimes(message: string): boolean {
  return /\b(what time|exact time|start and finish|specific times|from when|until when|which hours|o'clock)\b/i.test(message);
}

function indicativeWindow(record: AssessmentRecord): boolean {
  const window = record.availability.window.value;
  return Boolean(window && isPartOfDayWindow(window));
}

function nextQuestion(record: AssessmentRecord, gap: EssentialGap | null, asked: string[], redirect: Redirect | null): string {
  if (gap === 'schedule') return scheduleQuestion(record, asked);
  if (redirect === 'projects' && peakFollowUpAvailable(record, asked)) {
    asked.push('peak');
    return PEAK_FOLLOW_UP;
  }
  if (!gap) {
    if (!asked.includes('close')) asked.push('close');
    return CLOSE_QUESTION;
  }
  return gapQuestion(gap, record, asked);
}

function peakFollowUpAvailable(record: AssessmentRecord, asked: string[]): boolean {
  return (
    (record.project.status ?? 'unknown') === 'not_applicable' &&
    Boolean(record.workload.peak.value && /group travel/i.test(record.workload.peak.value)) &&
    !asked.includes('peak')
  );
}

function scheduleQuestion(record: AssessmentRecord, asked: string[]): string {
  if (!asked.includes('schedule')) asked.push('schedule');
  const stated = record.workload.activeTime.value?.stated ?? 'those daily hours';
  return `You mentioned needing ${stated}. How many days a week would you need that? I won't assume a five-day week.`;
}

function gapQuestion(gap: EssentialGap, record: AssessmentRecord, asked: string[]): string {
  if (!asked.includes(gap)) asked.push(gap);
  if (gap === 'schedule') return scheduleQuestion(record, asked);
  if (gap === 'business') {
    return "Could you tell me a little about your business, and what's prompted you to look for operational support?";
  }
  if (gap === 'support') return 'Which parts of the work are taking the time?';
  if (gap === 'workload') {
    return 'Roughly how much active working time does this take, and is that per day or per week? If you are not sure of a number, say so.';
  }
  if (gap === 'availability') {
    return 'When would someone need to be available — for example mornings, across the working day, or only while the work is being done? Exact start and finish times can wait.';
  }
  return 'Are you leaning towards outsourced support, hiring someone, or are you still comparing the two?';
}
