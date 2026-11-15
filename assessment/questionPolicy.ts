import { hasResponsibilities, type EssentialGap } from './coverage';
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
    /\bmornings?\b/i.test(text) ? 'morning' : null,
    lateAfternoon ? 'late afternoon' : /\bafternoons?\b/i.test(text) ? 'afternoon' : null,
    /\bevenings?\b/i.test(text) ? 'evening' : null,
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
  const role = record.executive.requestedRole?.value;
  if (role) {
    lines.push(
      `They asked for a ${role}. That is the role they named, not confirmation it is the right fit. Do not assume it, and do not recommend a different role.`,
    );
  }
  if (!hasResponsibilities(record)) {
    lines.push('Responsibilities are not yet known. Ask what they want taken off their plate before hours, days or availability.');
  }
  const time = record.workload.activeTime.value;
  if (time) {
    const calculated =
      time.unit === 'day' && time.weeklyHours != null ? ` A weekly figure of ${time.weeklyHours} hours was calculated from their estimate, not assessed from the work.` : '';
    lines.push(
      `Visitor hour estimate, not a validated workload: ${time.stated}.${time.needsClarification ? ' Days were not stated, so it has not been converted into a week.' : ''}${calculated} Do not ask for the hours again. Assessed workload is not calculated yet. Do not invent a higher or lower figure.`,
    );
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

type Redirect = 'hours' | 'projects' | 'clock' | 'software' | 'repeat' | 'premature';

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
  const redirect = redirectReason(text, input.record, asked);

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

function redirectReason(message: string, record: AssessmentRecord, asked: string[]): Redirect | null {
  if (!message.includes('?')) return null;
  if (reopensClosedProjects(message, record)) return 'projects';
  if (!hasResponsibilities(record) && !asksAboutTheWork(message)) return 'premature';
  if (openWorkDrivers(record, asked).length > 0 && !addressesOpenDriver(message, record, asked)) return 'premature';
  if (prematureScheduling(message, record, asked)) return 'premature';
  if (reopensCorrectedUnit(message, record)) return 'hours';
  if (repeatsKnownHours(message, record)) return 'hours';
  if (demandsClockTimes(message)) return 'clock';
  if (record.process.skipped && /\b(software|systems|which tools|automation)\b/i.test(message)) return 'software';
  if (hasResponsibilities(record) && /\bwhich parts of the work\b/i.test(message)) return 'repeat';
  return null;
}

/** Duties are still unknown, so only a question about the work itself should stand. */
function asksAboutTheWork(message: string): boolean {
  return /take off your plate|which parts of the work|what would you (?:actually )?want this person to take on/i.test(message);
}

function reopensClosedProjects(message: string, record: AssessmentRecord): boolean {
  const status = record.project.status ?? 'unknown';
  if (status === 'unknown') return false;
  if (!/\bprojects?\b/i.test(message)) return false;
  return !/\b(group travel|busier|during those|additional support|how many|chasing|tracking)\b/i.test(message);
}

function prematureScheduling(message: string, record: AssessmentRecord, asked: string[]): boolean {
  const asksHours = /\b(how many hours|hours per day or week|hours a day or a week|expect the\b.{0,80}\bto work|active working time)\b/i.test(
    message,
  );
  const asksDays = /\bhow many days\b/i.test(message);
  const asksAvailability = /\b(availability|specific times|flexibility|when would someone need to be available)\b/i.test(message);
  if (!asksHours && !asksDays && !asksAvailability) return false;
  if (!hasResponsibilities(record)) return true;
  if (openWorkDrivers(record, asked).length > 0) return true;
  if (asksHours && record.workload.activeTime.value) return true;
  return false;
}

function reopensCorrectedUnit(message: string, record: AssessmentRecord): boolean {
  const time = record.workload.activeTime.value;
  if (!record.workload.activeTime.revised) return false;
  if (time?.unit === 'day') return /\b(per week|weekly)\b/i.test(message);
  if (time?.unit === 'week') return /\b(per day|daily)\b/i.test(message);
  return false;
}

function repeatsKnownHours(message: string, record: AssessmentRecord): boolean {
  const time = record.workload.activeTime.value;
  if (!time) return false;
  if (time.needsClarification && /\bhow many days\b/i.test(message)) return false;
  return /\b(how much active|how many hours|active working time|per day or per week|is that per day|how long does(?: this| that)? take)\b/i.test(message);
}

/** Named duties still need one material follow-up. This is the topic state, not a script of every category. */
export function openWorkDrivers(record: AssessmentRecord, asked: string[]): string[] {
  const duties = record.executive.responsibilities.value ?? [];
  const evidence = (record.workload.evidence ?? []).map((note) => note.text).join(' ');
  const pending: string[] = [];
  if (duties.includes('Inbox management') && !asked.includes('inbox-depth') && !/\d+\s+emails|triage|more than triage|repl/i.test(evidence)) {
    pending.push('inbox-depth');
  }
  const diaryNamed = duties.some((duty) => /diary|calendar|scheduling|client meeting/i.test(duty));
  if (diaryNamed && !asked.includes('diary-depth') && !/external|internal meetings|meetings a week|\d+\s+meetings/i.test(evidence)) {
    pending.push('diary-depth');
  }
  if (duties.includes('Meeting minutes') && !asked.includes('minutes-depth') && !/full note|actions afterwards|in the meeting/i.test(evidence)) {
    pending.push('minutes-depth');
  }
  const chasingNamed = (record.project.notes.value ?? []).some((note) => /chasing/i.test(note));
  const projectsNamed = (record.project.status ?? 'unknown') !== 'not_applicable' && (record.project.notes.value ?? []).some((note) => note !== 'None' && !/chasing/i.test(note));
  if ((chasingNamed || projectsNamed) && !asked.includes('project-depth') && !/in more detail|regular part|mostly colleagues/i.test(evidence)) {
    pending.push('project-depth');
  }
  if ((record.operations.notes.value?.length ?? 0) > 0 && !asked.includes('ops-depth') && !/regular|each week|weekly|seasonal/i.test(evidence)) {
    pending.push('ops-depth');
  }
  if (record.workload.peak.value && !asked.includes('peak') && !/extra support|during those/i.test(evidence)) pending.push('peak');
  return pending;
}

function addressesOpenDriver(message: string, record: AssessmentRecord, asked: string[]): boolean {
  if (/\b(how many hours|how many days|availability|what time|exact time)\b/i.test(message)) return false;
  const pending = openWorkDrivers(record, asked);
  if (pending.includes('inbox-depth') && /\b(emails?|inbox|triage|reply|replies)\b/i.test(message)) return true;
  if (pending.includes('diary-depth') && /\b(meetings?|diary|internal|external)\b/i.test(message)) return true;
  if (pending.includes('minutes-depth') && /\bminutes\b/i.test(message)) return true;
  if (pending.includes('project-depth') && /\b(chas\w*|stakeholders|projects?)\b/i.test(message)) return true;
  if (pending.includes('ops-depth') && /\b(onboarding|process|recurring|operational)\b/i.test(message)) return true;
  if (pending.includes('peak') && /\b(peak|busier|season)\b/i.test(message)) return true;
  return false;
}

function demandsClockTimes(message: string): boolean {
  return /\b(what time|exact time|start and finish|specific times|from when|until when|which hours|o'clock)\b/i.test(message);
}

function nextQuestion(record: AssessmentRecord, gap: EssentialGap | null, asked: string[], redirect: Redirect | null): string {
  if (redirect === 'projects' && peakFollowUpAvailable(record, asked)) {
    asked.push('peak');
    return PEAK_FOLLOW_UP;
  }
  if (!hasResponsibilities(record)) return supportQuestion(record, asked);
  const follow = takeFollowUp(record, asked);
  if (follow) return follow;
  if (gap === 'schedule') return scheduleQuestion(record, asked);
  if (!gap) {
    if (!asked.includes('close')) asked.push('close');
    return CLOSE_QUESTION;
  }
  return gapQuestion(gap, record, asked);
}

function supportQuestion(record: AssessmentRecord, asked: string[]): string {
  if (!asked.includes('support')) {
    asked.push('support');
    if (record.executive.requestedRole?.value === 'Executive Assistant') {
      return 'What would you like the EA to take off your plate? For example, inbox and diary management, client meeting coordination, document preparation or following up with your team?';
    }
    return 'Which parts of the work are taking the time?';
  }
  if (!asked.includes('support-followup')) asked.push('support-followup');
  return 'That hour figure is only a starting estimate. What would you actually want this person to take on?';
}

/** Enough is known to stop: the main duties are named and each one has been followed up or already described. */
export function canFinish(record: AssessmentRecord, asked: string[]): boolean {
  return hasResponsibilities(record) && openWorkDrivers(record, asked).length === 0;
}

function takeFollowUp(record: AssessmentRecord, asked: string[]): string | null {
  const pending = openWorkDrivers(record, asked);
  const latest = record.statements?.at(-1)?.text ?? '';
  const peakIsNew = Boolean(record.workload.peak.evidence && record.workload.peak.evidence === latest && pending.includes('peak'));
  const minutesIsNew = pending.includes('minutes-depth') && /\bminutes\b/i.test(latest);
  const next = peakIsNew ? 'peak' : minutesIsNew ? 'minutes-depth' : pending[0];
  if (!next) return null;
  asked.push(next);
  if (next === 'inbox-depth') {
    return 'You mentioned the inbox. Roughly how many emails come in, how much needs a reply rather than triage, and how quickly those replies are expected? A rough sense is enough.';
  }
  if (next === 'diary-depth') {
    return 'You mentioned the diary. Roughly how many meetings are in a typical week, and are they mostly internal or with people outside the firm?';
  }
  if (next === 'minutes-depth') {
    return 'You mentioned minutes. Do you need someone in the meeting to write them, and is that a full note or just the actions afterwards?';
  }
  if (next === 'project-depth') {
    return 'You mentioned project coordination. Roughly how many are active, and is the work mostly chasing people, tracking actions, or both?';
  }
  if (next === 'ops-depth') {
    return 'You mentioned operational coordination. Is that a regular part of the week, or mainly at certain points in the year?';
  }
  if (record.workload.peak.value && /group travel/i.test(record.workload.peak.value)) return PEAK_FOLLOW_UP;
  return 'You mentioned busier periods. What extra support do you need then, compared with a normal week?';
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
