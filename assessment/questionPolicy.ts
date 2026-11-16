import { hasResponsibilities, type EssentialGap } from './coverage';
import { say } from './messageFormat';
import { pictureFrom, recommendRole } from './role/recommend';
import type { AssessmentRecord } from './types';
import { storedSpan } from './workload/counts';

const SAFE_CLOSE =
  "That's enough to set out a leading recommendation. A complete assessment still needs an indicative weekly workload range, and that range is outstanding where an approved benchmark does not yet apply. I haven't calculated a cost.";

const BLOCKED_REPLY = /£|\$\s?\d|\bper hour\b|\bi recommend\b|\brecruitment fee\b|\bon-?costs?\b|\bsalary\b/i;

const FILLER = /^(thanks?( you)?|thank you|noted|understood|great|okay|ok|sure|got it|of course)[.!]?\s*$/i;

const PEAK_FOLLOW_UP = say({
  before: 'You mentioned that group travel creates busier periods.',
  question: 'What additional support do you typically need during those times?',
});

const CLOSE_QUESTION = say({
  question: "Before I put together your recommendation, is there anything else taking up your time that you'd ideally like to delegate?",
});

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
    lines.push(`They asked for a ${role}. That is the role they named. The leading recommendation follows the responsibilities.`);
  }
  const recommendation = recommendRole(record);
  if (recommendation) {
    lines.push(
      `Leading role from the evidence: ${recommendation.headline}. ${recommendation.explanation} Do not call this a blended role unless the record shows substantive project management.`,
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
  if (record.workload.assessment && !record.workload.assessment.complete) {
    lines.push(`Workload reading, not a complete assessment: ${record.workload.assessment.summary}`);
  }
  if (record.staffing.engagement?.value) {
    lines.push(`Working arrangement mentioned: ${record.staffing.engagement.value}. Do not treat this as the pattern of a task unless they said so.`);
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
  let text = input.message.replace(/[^\S\n]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, 1200);
  text = text.replace(/^(?:thank you|thanks)(?:\s+for\s+(?:that|sharing(?:\s+that)?|your (?:reply|answer)))?[.!]\s+/i, '');
  const redirect = redirectReason(text, input.record, asked);

  if (!text || BLOCKED_REPLY.test(text) || redirect) {
    text = input.complete ? SAFE_CLOSE : nextQuestion(input.record, input.gap, asked, redirect);
  } else {
    rememberKeptQuestion(text, asked);
  }

  if (input.complete) {
    if (!/leading recommendation/i.test(text)) text = `${text} ${SAFE_CLOSE}`.trim();
    return { text, asked };
  }

  if ((input.gap || askedNeedsClose(input.record, input.gap)) && !text.includes('?')) {
    const question = nextQuestion(input.record, input.gap, asked, null);
    text = FILLER.test(text) ? question : `${text} ${question}`.trim();
  }
  return { text: emphasizeQuestion(text), asked };
}

/** The principal question is bold whichever path wrote it. Context stays in normal text. */
function emphasizeQuestion(text: string): string {
  if (/\*\*[^*?\n]{0,280}\?\s*\*\*/.test(text)) return text;
  return text.replace(/([^.!?\n]{8,280}\?)/, (sentence) => `**${sentence.trim()}**`);
}

function askedNeedsClose(record: AssessmentRecord, gap: EssentialGap | null): boolean {
  return gap == null && (record.statements?.length ?? 0) > 0;
}

function redirectReason(message: string, record: AssessmentRecord, asked: string[]): Redirect | null {
  if (!message.includes('?')) return null;
  if (reopensClosedProjects(message, record)) return 'projects';
  if (buildsOnUnsupported(message, record)) return 'premature';
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
function buildsOnUnsupported(message: string, record: AssessmentRecord): boolean {
  const notes = record.operations.notes.value ?? [];
  const generalOps = notes.some((note) => !/invoic|bookkeep/i.test(note));
  if (/\boperational coordination\b/i.test(message) && !generalOps) return true;
  if (record.staffing.engagement?.source === 'provisional' && /\b(throughout the year|weekly pattern|varies throughout)\b/i.test(message)) return true;
  if (/\blight\b/i.test(message) && /\b(email|inbox)\b/i.test(message)) return true;
  const picture = pictureFrom(record);
  if (/\bblended role\b/i.test(message) && picture.projectDepth !== 'management') return true;
  const asksDuration = /\bhow long\b/i.test(message) && /\b(meetings?|they last|those last)\b/i.test(message);
  if (asksDuration && picture.meetingNature !== 'attend' && picture.meetingNature !== 'both') return true;
  const evidence = (record.workload.evidence ?? []).map((note) => note.text).join(' ');
  if (/\b(straightforward to arrange|more involved)\b/i.test(message) && !schedulingAnswerCouldChange(record, evidence)) return true;
  const asksDocumentClass = /\b(simple|complex|substantial|how long)\b/i.test(message) && /\bdocuments?\b/i.test(message);
  const duties = record.executive.responsibilities.value ?? [];
  if (asksDocumentClass && duties.includes('Sending documents') && !duties.includes('Document preparation')) return true;
  return false;
}

function rememberKeptQuestion(message: string, asked: string[]): void {
  if (!message.includes('?')) return;
  const mark = (id: string) => {
    if (!asked.includes(id)) asked.push(id);
  };
  if (/\binvoic|bookkeep/i.test(message)) mark('books-depth');
  if (/\b(how many meetings|typical week)\b/i.test(message) && /\b(diary|meeting|scheduling)\b/i.test(message)) mark('diary-depth');
  if (/\b(arrange them|attend them|attend those meetings|schedule them)\b/i.test(message)) mark('meeting-nature');
  if (/\b(arranges them, attends them|which of those)\b/i.test(message)) mark('meeting-clarify');
  if (/\b(triage|draft|repl\w*|filter|flag)\b/i.test(message) && /\bemails?\b/i.test(message)) mark('inbox-handling');
  if (/\b(client accounts|actively manage)\b/i.test(message)) mark('project-nature');
  if (/\b(straightforward to arrange|more involved)\b/i.test(message)) mark('schedule-shape');
  if (/\bhow often does that follow-up\b/i.test(message)) mark('follow-up-cadence');
  if (/\bremotely, or need to be there\b/i.test(message)) mark('attendance-mode');
  if (/\bstill prepare minutes\b/i.test(message)) mark('minutes-clarify');
  if (/\bpart[- ]time\b/i.test(message) && /\bassistant\b/i.test(message)) mark('engagement-clarify');
}

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

/** A follow-up is open only when the answer could still change the role, the workload reading, coverage or confidence. */
export function openWorkDrivers(record: AssessmentRecord, asked: string[]): string[] {
  const duties = record.executive.responsibilities.value ?? [];
  const evidence = (record.workload.evidence ?? []).map((note) => note.text).join(' ');
  const picture = pictureFrom(record);
  const pending: string[] = [];
  const projectsNamed =
    (record.project.status ?? 'unknown') !== 'not_applicable' &&
    (record.project.notes.value ?? []).some((note) => note !== 'None');
  const stated = (record.statements ?? []).map((statement) => statement.text).join('\n');
  const emailKnown = /about \d+(?:–\d+)? emails/i.test(evidence);
  const inboxNamed = duties.includes('Inbox management') || emailKnown;
  if (inboxNamed && !emailKnown && !picture.emailHandlingDescribed && !asked.includes('inbox-depth')) pending.push('inbox-depth');

  const meetingKnown = /about \d+(?:–\d+)? meetings/i.test(evidence);
  const meetingsNamed = meetingKnown || duties.some((duty) => /diary|calendar|scheduling|client meeting/i.test(duty));
  const activityKnown = picture.meetingNature !== 'unknown' || /the assistant does not attend the meetings|attendance in order to take minutes is not required/i.test(evidence);
  if (meetingsNamed && !meetingKnown && !asked.includes('diary-depth')) pending.push('diary-depth');

  const books = (record.operations.notes.value ?? []).some((note) => /invoic|bookkeep/i.test(note));
  const invoiceKnown = /invoice volume mentioned/i.test(evidence);
  if (books && !invoiceKnown && !asked.includes('books-depth')) pending.push('books-depth');
  else if (books && !invoiceKnown && record.staffing.engagement?.source === 'explicit' && !asked.includes('books-return')) pending.push('books-return');

  const meetingsDiscussed = meetingKnown || /\bmeetings?\b/i.test(stated);
  if (meetingsDiscussed && !activityKnown && !asked.includes('meeting-nature')) pending.push('meeting-nature');
  if (/short reply did not identify/i.test(evidence) && picture.meetingNature === 'unknown' && !asked.includes('meeting-clarify')) pending.push('meeting-clarify');
  if (emailKnown && !picture.emailHandlingDescribed && !asked.includes('inbox-handling')) pending.push('inbox-handling');
  if (projectsNamed && picture.projectDepth === 'unknown' && !asked.includes('project-nature')) pending.push('project-nature');
  if (schedulingAnswerCouldChange(record, evidence) && !asked.includes('schedule-shape')) pending.push('schedule-shape');
  const attends = picture.meetingNature === 'attend' || picture.meetingNature === 'both';
  if (attends && !/attended remotely|attended in person/i.test(evidence) && !asked.includes('attendance-mode')) pending.push('attendance-mode');
  if (followUpCouldChange(stated) && !asked.includes('follow-up-cadence')) pending.push('follow-up-cadence');
  if (
    /attendance in order to take minutes is not required/i.test(evidence) &&
    !/minute preparation was mentioned|minute preparation is not required/i.test(evidence) &&
    !asked.includes('minutes-clarify')
  ) {
    pending.push('minutes-clarify');
  }

  if (duties.includes('Meeting minutes') && !asked.includes('minutes-depth') && !/full note|actions afterwards|in the meeting/i.test(evidence)) {
    pending.push('minutes-depth');
  }
  if (record.staffing.engagement?.source === 'provisional' && !asked.includes('engagement-clarify')) pending.unshift('engagement-clarify');
  if (record.workload.peak.value && !asked.includes('peak') && !/extra support|during those/i.test(evidence)) pending.push('peak');
  return pending;
}

function schedulingAnswerCouldChange(record: AssessmentRecord, evidence: string): boolean {
  const picture = pictureFrom(record);
  if (picture.meetingNature !== 'schedule' && picture.meetingNature !== 'both') return false;
  const span = storedSpan(evidence, 'meetings');
  if (!span) return false;
  const text = `${(record.statements ?? []).map((statement) => statement.text).join('\n')}\n${evidence}`;
  const mixed = /\binternal\b/i.test(text) && /\bexternal\b/i.test(text);
  const involved = /\b(more involved|complex|several people|no calendar)\b/i.test(text);
  const simple = /\b(straightforward|one-to-one|simple external)\b/i.test(text);
  if (mixed || involved || simple) return false;
  const external = /\bexternal\b/i.test(text);
  const internal = /\binternal\b/i.test(text);
  if (internal && !external && span.low === 12 && span.high === 12) return false;
  return true;
}

function followUpCouldChange(stated: string): boolean {
  const named = /\b(chas(?:e|ing)|follow(?:ing|ed)?\s+up|follow[- ]ups?|action tracking)\b/i.test(stated);
  if (!named) return false;
  return !/\b(occasional(?:ly)?|each week|every week|weekly|daily|regularly|rarely|once a|few times|most days)\b/i.test(stated);
}

function addressesOpenDriver(message: string, record: AssessmentRecord, asked: string[]): boolean {
  if (/\b(how many hours|how many days|availability|what time|exact time)\b/i.test(message)) return false;
  const pending = openWorkDrivers(record, asked);
  if (pending.includes('inbox-depth') && /\b(emails?|inbox|triage|reply|replies)\b/i.test(message)) return true;
  if (pending.includes('inbox-handling') && /\b(emails?|inbox|triage|draft|repl\w*|follow)\b/i.test(message)) return true;
  if (pending.includes('books-depth') && /\b(invoic\w*|book\s*keep\w*)\b/i.test(message)) return true;
  if (pending.includes('books-return') && /\b(invoic\w*|book\s*keep\w*)\b/i.test(message)) return true;
  if (pending.includes('engagement-clarify') && /\bpart[- ]time\b/i.test(message)) return true;
  if (pending.includes('diary-depth') && /\b(meetings?|diary management|scheduling)\b/i.test(message)) return true;
  if (pending.includes('meeting-nature') && /\b(arrange|attend|schedule)\b/i.test(message)) return true;
  if (pending.includes('meeting-clarify') && /\b(arrange|attend|schedule)\b/i.test(message)) return true;
  if (pending.includes('schedule-shape') && /\b(straightforward|involved|complex|internal|external)\b/i.test(message)) return true;
  if (pending.includes('attendance-mode') && /\b(remote|in person|on-?site|video)\b/i.test(message)) return true;
  if (pending.includes('follow-up-cadence') && /\b(often|week|occasional|daily|regular)\b/i.test(message)) return true;
  if (pending.includes('minutes-clarify') && /\b(minutes|notes|actions)\b/i.test(message)) return true;
  if (pending.includes('minutes-depth') && /\bminutes\b/i.test(message)) return true;
  if (pending.includes('project-nature') && /\b(accounts?|manage|projects?|chas\w*)\b/i.test(message)) return true;
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
      return say({
        question: 'What would you most like your Executive Assistant to take off your plate?',
        after: 'For example, managing your inbox and diary, coordinating meetings, preparing documents or following up on actions.',
      });
    }
    return say({ question: 'Which parts of the work are taking the time?' });
  }
  if (!asked.includes('support-followup')) asked.push('support-followup');
  return say({
    before: 'That hour figure is only a starting estimate.',
    question: 'What would you actually want this person to take on?',
  });
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
    return say({
      before: 'You mentioned inbox management.',
      question: 'Roughly how many emails come in, and what would the assistant need to do with them?',
      after: 'For example triage, drafting, answering independently, or following things up. A rough sense is enough.',
    });
  }
  if (next === 'inbox-handling') {
    const count = (record.workload.evidence ?? []).map((note) => note.text).join(' ').match(/about (\d+(?:–\d+)?) emails/i);
    return say({
      before: count ? `You mentioned about ${count[1]} emails.` : 'You mentioned the inbox.',
      question: 'What would the assistant need to do with them: triage, draft replies, answer independently, follow things up, or some combination?',
      after: 'The number alone does not determine the workload. No time allowance is applied unless an approved benchmark matches.',
    });
  }
  if (next === 'diary-depth') {
    const diary = (record.executive.responsibilities.value ?? []).some((duty) => /diary|calendar|scheduling/i.test(duty));
    return say({
      before: diary ? 'You mentioned diary management.' : 'You mentioned the meetings.',
      question: 'Roughly how many meetings are in a typical week?',
    });
  }
  if (next === 'meeting-nature') {
    return say({
      question: 'What would the assistant do for those meetings: arrange them, attend them, or both?',
    });
  }
  if (next === 'meeting-clarify') {
    return say({
      question: 'Do you mean the assistant arranges the meetings, attends them, or both?',
    });
  }
  if (next === 'schedule-shape') {
    return say({
      question: 'Are those straightforward to arrange, or is the coordination more involved?',
    });
  }
  if (next === 'attendance-mode') {
    return say({
      question: 'Would the assistant join those meetings remotely, or need to be there in person?',
    });
  }
  if (next === 'follow-up-cadence') {
    return say({
      question: 'How often does that follow-up come up in a typical week?',
    });
  }
  if (next === 'minutes-clarify') {
    const stated = (record.statements ?? []).map((statement) => statement.text).join('\n');
    const actionsKnown = /\b(action follow-up|action tracking|following up|follow up|agendas)\b/i.test(stated);
    return say({
      question: actionsKnown
        ? 'Should the assistant still prepare minutes, even though they would not attend?'
        : 'Should the assistant still prepare minutes or action notes, without attending the meeting?',
    });
  }
  if (next === 'project-nature') {
    const count = record.project.activeProjects.value;
    return say({
      before: count && count !== 'None' ? `You mentioned ${count}.` : 'You mentioned the client work.',
      question: 'Are these client accounts to track and chase, or projects the assistant would actively manage?',
    });
  }
  if (next === 'books-depth' || next === 'books-return') {
    return say({
      before: 'You mentioned invoicing as part of the bookkeeping.',
      question: 'Roughly how many invoices are there in a typical week or month?',
      after: 'A rough sense is enough.',
    });
  }
  if (next === 'engagement-clarify') {
    return say({
      before: 'Part time can describe the assistant’s working arrangement, rather than the pattern of the work.',
      question: 'Do you mean the assistant should work part time?',
    });
  }
  if (next === 'minutes-depth') {
    return say({
      before: 'You mentioned meeting minutes.',
      question: 'Do you need someone in the meeting to write them, and is that a full note or just the actions afterwards?',
    });
  }
  if (next === 'project-depth') {
    return say({
      before: 'You mentioned project coordination.',
      question: 'Roughly how many are active, and is the work mostly chasing people, tracking actions, or both?',
    });
  }
  if (next === 'ops-depth') {
    return say({
      before: 'You mentioned operational coordination.',
      question: 'Is that a regular part of the week, or mainly at certain points in the year?',
    });
  }
  if (record.workload.peak.value && /group travel/i.test(record.workload.peak.value)) return PEAK_FOLLOW_UP;
  return say({
    before: 'You mentioned busier periods.',
    question: 'What extra support do you need then, compared with a normal week?',
  });
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
  return say({
    before: `You mentioned needing ${stated}.`,
    question: "How many days a week would you need that?",
    after: "I won't assume a five-day week.",
  });
}

function gapQuestion(gap: EssentialGap, record: AssessmentRecord, asked: string[]): string {
  if (!asked.includes(gap)) asked.push(gap);
  if (gap === 'schedule') return scheduleQuestion(record, asked);
  if (gap === 'business') {
    return say({ question: "Could you tell me a little about your business, and what's prompted you to look for operational support?" });
  }
  if (gap === 'support') return say({ question: 'Which parts of the work are taking the time?' });
  if (gap === 'workload') {
    return say({
      question: 'Roughly how much active working time does this take, and is that per day or per week?',
      after: 'If you are not sure of a number, say so.',
    });
  }
  if (gap === 'availability') {
    return say({
      question: 'When would someone need to be available — for example mornings, across the working day, or only while the work is being done?',
      after: 'Exact start and finish times can wait.',
    });
  }
  return say({ question: 'Are you leaning towards outsourced support, hiring someone, or are you still comparing the two?' });
}
