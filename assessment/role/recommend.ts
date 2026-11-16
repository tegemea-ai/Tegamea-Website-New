import { hasResponsibilities } from '../coverage';
import type { AssessmentRecord } from '../types';
import { statedWorkingTimeDetail } from '../workingTime';

export type RecommendedRole = 'Executive Assistant' | 'Project Support' | 'Operations Coordinator' | 'Blended arrangement';
export type MeetingNature = 'attend' | 'schedule' | 'both' | 'unknown';
export type ProjectDepth = 'routine' | 'management' | 'unknown';

/** Distinctions the recommendation uses. These describe the work. They do not assign hours. */
export interface WorkPicture {
  meetingNature: MeetingNature;
  projectDepth: ProjectDepth;
  emailHandlingDescribed: boolean;
  executiveAdmin: boolean;
  specialistFinance: boolean;
}

export interface RoleRecommendation {
  role: RecommendedRole;
  headline: string;
  explanation: string;
  responsibilities: string[];
  requestedHours: string | null;
  workloadStatement: string;
  staffing: string;
  assumptions: string[];
  /** True only when the Stage B workload reading is a complete weekly range. */
  assessmentComplete: boolean;
}

export interface ClientSection {
  title: string;
  body: string[];
}

const OUTSTANDING_RANGE =
  'This is a leading recommendation, not a complete assessment. A complete assessment includes an indicative weekly workload range built from approved benchmarks. Where that range is missing, the gap is outstanding work, and no hours have been assumed.';

export function pictureFrom(record: AssessmentRecord): WorkPicture {
  const text = (record.statements ?? []).map((statement) => statement.text).join('\n');
  const evidence = (record.workload.evidence ?? []).map((note) => note.text).join('\n');
  const duties = record.executive.responsibilities.value ?? [];
  let attend = /meetings are attended/i.test(evidence);
  let schedule = /meetings are scheduled/i.test(evidence);
  for (const statement of record.statements ?? []) {
    const line = statement.text;
    if (/\bmeetings?\b/i.test(line) && /\b(attend|attending)\b/i.test(line)) attend = true;
    if (/\b(?:schedul\w+|arrang\w+)\b(?:\s+\w+){0,8}\s+meetings?\b/i.test(line)) schedule = true;
    if (/\bmeetings?\b(?:\s+\w+){0,10}\b(?:schedul\w+|arranged|to arrange)\b/i.test(line)) schedule = true;
  }
  const management =
    /projects require active management/i.test(evidence) ||
    /\b(project manag\w+|actively manage|manage (?:the |those |these |their )?projects|run (?:the |those |these )?projects|plan and run)\b/i.test(text) ||
    /\bmanage (?:a |the |other )?(?:project coordinator|other support staff|support staff)\b/i.test(text);
  const routineLanguage = /\broutine\b/i.test(text) && /\b(chas|follow|action|track|coordinat)/i.test(text);
  const chasing =
    /\b(chas(?:e|ing)|action tracking|follow[- ]?ups?)\b/i.test(text) ||
    (record.project.notes.value ?? []).some((note) => /chas|action tracking|follow/i.test(note));
  let projectDepth: ProjectDepth = 'unknown';
  if (management) projectDepth = 'management';
  else if (routineLanguage || chasing) projectDepth = 'routine';

  const emailHandlingDescribed =
    /more than triage|includes triage/i.test(evidence) ||
    (record.statements ?? []).some(
      (statement) =>
        /\b(emails?|inbox)\b/i.test(statement.text) &&
        /\b(triage|draft(?:ing|s)?|repl(?:y|ies)|respond(?:s|ing)?|follow(?:\s|-)?up)\b/i.test(statement.text),
    );

  return {
    meetingNature: attend && schedule ? 'both' : attend ? 'attend' : schedule ? 'schedule' : 'unknown',
    projectDepth,
    emailHandlingDescribed,
    executiveAdmin: duties.some((duty) => /inbox|diary|calendar|scheduling|meeting|document/i.test(duty)),
    specialistFinance: (record.operations.notes.value ?? []).some((note) => /bookkeep|invoic/i.test(note)),
  };
}

export function recommendRole(record: AssessmentRecord): RoleRecommendation | null {
  if (!hasResponsibilities(record)) return null;
  const picture = pictureFrom(record);
  const requested = record.executive.requestedRole?.value;
  const responsibilities = responsibilityLines(record, picture);
  const role = chooseRole(picture, requested);
  const coordination = picture.projectDepth === 'routine' || responsibilities.some((line) => /client|meeting|follow-up/i.test(line));
  const headline =
    role === 'Executive Assistant' && coordination
      ? 'Experienced Executive Assistant, including client and project coordination'
      : role === 'Blended arrangement'
        ? 'Executive support together with substantive project management'
        : role;
  return {
    role,
    headline,
    explanation: explain(role, requested, responsibilities, picture),
    responsibilities,
    requestedHours: requestedHours(record),
    workloadStatement: workloadStatement(record),
    staffing: staffingConsiderations(record),
    assumptions: assumptions(record, picture),
    assessmentComplete: record.workload.assessment?.complete === true,
  };
}

export function clientResult(record: AssessmentRecord): { headline: string; status: string; sections: ClientSection[] } | null {
  const recommendation = recommendRole(record);
  if (!recommendation) return null;
  const sections: ClientSection[] = [
    { title: 'Why this role', body: [recommendation.explanation] },
    { title: 'Main responsibilities', body: recommendation.responsibilities },
    { title: 'Weekly workload', body: [recommendation.workloadStatement] },
  ];
  if (recommendation.requestedHours) sections.push({ title: 'Hours you asked for', body: [recommendation.requestedHours] });
  sections.push({ title: 'Staffing', body: [recommendation.staffing] });
  if (recommendation.assumptions.length) {
    sections.push({ title: 'Assumptions that could change this', body: recommendation.assumptions });
  }
  const status = recommendation.assessmentComplete
    ? 'The role and the weekly range below are the indicative assessment.'
    : 'The role below is the leading recommendation. The weekly workload range is still incomplete.';
  return { headline: recommendation.headline, status, sections };
}

function chooseRole(picture: WorkPicture, requested: string | null | undefined): RecommendedRole {
  const executiveShape = picture.executiveAdmin || picture.projectDepth === 'routine' || requested === 'Executive Assistant';
  if (picture.projectDepth === 'management' && (picture.executiveAdmin || requested === 'Executive Assistant')) return 'Blended arrangement';
  if (picture.projectDepth === 'management') return 'Project Support';
  if (executiveShape) return 'Executive Assistant';
  if (picture.specialistFinance) return 'Operations Coordinator';
  return 'Executive Assistant';
}

function explain(role: RecommendedRole, requested: string | null | undefined, responsibilities: string[], picture: WorkPicture): string {
  const work = responsibilities.join('; ');
  if (role === 'Blended arrangement') {
    return `An Executive Assistant can cover executive administration, client coordination, routine follow-up, action tracking and stakeholder communication. ${work}. The evidence also describes substantive project management, so the leading arrangement is executive support together with that project responsibility.`;
  }
  if (role === 'Project Support') {
    return `The work described is substantive project management: ${work}. That is the leading role. Routine chasing on its own would have stayed inside an Executive Assistant brief.`;
  }
  if (role === 'Operations Coordinator') {
    return `The brief is ${work}. That is one role. Bookkeeping is specialist work, it has no approved hour rate, and on this evidence it does not require a second person.`;
  }
  const asked = requested === 'Executive Assistant' ? 'You asked for an Executive Assistant. ' : '';
  const finance = picture.specialistFinance
    ? ' Bookkeeping or invoicing is specialist work inside this same brief. It does not create a second role, and it has no approved hour rate.'
    : '';
  return `${asked}The described work — ${work} — sits within an experienced Executive Assistant brief. Routine client and project coordination stays inside that brief. A second role is not indicated.${finance}`;
}

function responsibilityLines(record: AssessmentRecord, picture: WorkPicture): string[] {
  const duties = record.executive.responsibilities.value ?? [];
  const evidence = (record.workload.evidence ?? []).map((note) => note.text).join(' ');
  const lines: string[] = [];
  if (duties.includes('Inbox management') || /about \d+ emails/i.test(evidence)) lines.push('Inbox management');
  if (duties.some((duty) => /diary|calendar|scheduling/i.test(duty))) lines.push('Diary and scheduling');
  if (/about \d+ meetings/i.test(evidence) || duties.some((duty) => /meeting/i.test(duty))) {
    if (picture.meetingNature === 'attend') lines.push('Attending meetings');
    else if (picture.meetingNature === 'schedule') lines.push('Scheduling meetings');
    else if (picture.meetingNature === 'both') lines.push('Attending and scheduling meetings');
    else lines.push('Meetings, still to be distinguished between attending and scheduling');
  }
  if (duties.includes('Sending documents')) lines.push('Sending documents to clients');
  if (duties.includes('Document preparation')) lines.push('Document preparation');
  if (picture.projectDepth === 'management') lines.push('Active project management');
  else if (picture.projectDepth === 'routine') lines.push('Routine client follow-up and action tracking');
  const finance = (record.operations.notes.value ?? []).filter((note) => /bookkeep|invoic/i.test(note));
  if (finance.length) lines.push(finance.join(', '));
  return lines.length ? lines : ['The responsibilities named in the conversation'];
}

function requestedHours(record: AssessmentRecord): string | null {
  const fact = record.workload.requestedTime.value ? record.workload.requestedTime : record.workload.activeTime;
  const time = fact.value;
  if (!time) return null;
  return `${statedWorkingTimeDetail(time, Boolean(fact.revised))}. This is the request, kept separate from any assessed range.`;
}

function workloadStatement(record: AssessmentRecord): string {
  const reading = record.workload.assessment;
  if (reading?.complete && reading.summary) return reading.summary;
  if (reading?.summary) return `${reading.summary} ${OUTSTANDING_RANGE}`;
  return `No indicative weekly range is available yet, because no approved benchmark matches the work described, and no allowance has been invented. ${OUTSTANDING_RANGE}`;
}

function staffingConsiderations(record: AssessmentRecord): string {
  const time = record.workload.requestedTime.value ?? record.workload.activeTime.value;
  const weekly = time?.unit === 'week' ? time.amount : (time?.weeklyHours ?? null);
  const preference =
    record.staffing.model.value === 'outsourced'
      ? 'You mentioned outsourced support. '
      : record.staffing.model.value === 'permanent'
        ? 'You mentioned hiring. '
        : record.staffing.model.value === 'comparing'
          ? 'You are comparing outsourcing and hiring. '
          : '';
  if (weekly != null && weekly >= 25) {
    return `${preference}At ${weekly} hours a week, direct employment is worth considering alongside outsourcing. That consideration does not decide the arrangement, and it is not a price.`;
  }
  if (weekly != null) {
    return `${preference}A brief around ${weekly} hours a week can be outsourced or employed. Direct employment is a particular consideration once a brief reaches 25 hours a week. This is not a price.`;
  }
  return `${preference}Outsourced support and employment can both suit this brief. Which fits depends on the weekly range, which is not complete yet. This is not a price.`;
}

function assumptions(record: AssessmentRecord, picture: WorkPicture): string[] {
  const evidence = (record.workload.evidence ?? []).map((note) => note.text).join(' ');
  const items: string[] = [];
  if (/about \d+ meetings/i.test(evidence) && picture.meetingNature === 'unknown') {
    items.push('Whether the meetings are attended or scheduled is still open. That can change the workload reading and the coverage.');
  }
  if (/about \d+ emails/i.test(evidence) && !picture.emailHandlingDescribed) {
    items.push('What the assistant has to do with the emails is still open. The number alone does not determine the workload, and no time allowance is applied unless an approved benchmark matches.');
  }
  const projectsOpen = (record.project.status ?? 'unknown') !== 'not_applicable' && record.project.mentioned && picture.projectDepth === 'unknown';
  if (projectsOpen) {
    items.push('Whether the client work is accounts to track or projects to manage is still open. That can change the role.');
  }
  if (picture.projectDepth === 'routine') {
    items.push('Chasing and action tracking are read as routine coordination. Substantive project management would change the role.');
  }
  if (picture.specialistFinance) {
    items.push('Bookkeeping or invoicing stays outside the weekly range because there is no approved hour rate.');
  }
  const hoursKnown = Boolean(record.workload.requestedTime.value ?? record.workload.activeTime.value);
  if (hoursKnown && !record.availability.window.value && !record.availability.workingDays.value) {
    items.push('Availability has not been discussed. Active working hours are separate from being reachable throughout the day.');
  }
  return items;
}
