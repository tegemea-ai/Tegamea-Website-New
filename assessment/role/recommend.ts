import { hasResponsibilities } from '../coverage';
import type { AssessmentRecord } from '../types';
import { statedWorkingTimeDetail } from '../workingTime';
import { hypothesisFrom, type PurposeArea, type SupportHypothesis } from './hypothesis';

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
  'This role recommendation is separate from the workload reading. A complete weekly range is produced only where an approved benchmark applies. Work with no approved benchmark stays unquantified, and no hours have been assumed. That is a limit of the current workload methodology.';

export function pictureFrom(record: AssessmentRecord): WorkPicture {
  const text = (record.statements ?? []).map((statement) => statement.text).join('\n');
  const evidence = (record.workload.evidence ?? []).map((note) => note.text).join('\n');
  const duties = record.executive.responsibilities.value ?? [];
  const refusesAllAttendance = /the assistant does not attend the meetings/i.test(evidence);
  let attend = /meetings are attended/i.test(evidence);
  let schedule = /meetings are scheduled|includes arranging/i.test(evidence);
  for (const statement of record.statements ?? []) {
    const line = statement.text;
    const refusesMinutesAttendance = /\b(?:do(?:es)?\s+not|doesn't|doesnt|do not|no need to)\b[\s\S]{0,50}\battend\b[\s\S]{0,50}\bminutes?\b/i.test(line);
    const refusesAttendance = /\b(?:do(?:es)?\s+not|doesn't|doesnt|do not|no need to|without)\b(?:\s+\w+){0,6}\s+attend/i.test(line);
    const refusesArranging = /\b(?:do(?:es)?\s+not|doesn't|doesnt|do not|not)\b(?:\s+\w+){0,5}\s+(?:schedul|arrang)/i.test(line);
    if (/\bmeetings?\b/i.test(line) && /\battend/i.test(line) && !refusesAttendance && !refusesMinutesAttendance) attend = true;
    if (/\bmeetings?\b/i.test(line) && /\b(schedul\w+|arrang\w+)\b/i.test(line) && !refusesArranging) schedule = true;
  }
  if (refusesAllAttendance) attend = false;
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
    /more than triage|includes triage|filters emails|flags matters|responds to routine/i.test(evidence) ||
    (record.statements ?? []).some((statement) =>
      statement.text.split(/,| and /i).some(
        (clause) =>
          /\b(emails?|inbox)\b/i.test(clause) &&
          /\b(triage|draft(?:ing|s)?|repl(?:y|ies)|respond(?:s|ing)?|filter(?:s|ing)?|flag(?:s|ging)?)\b/i.test(clause),
      ),
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
  const hypothesis = hypothesisFrom(record);
  const finance = picture.specialistFinance;
  const role = chooseRole(hypothesis, finance);
  if (!role) return null;
  const requested = record.executive.requestedRole?.value;
  const responsibilities = responsibilityLines(record, picture, hypothesis);
  return {
    role,
    headline: headlineFor(role, hypothesis),
    explanation: explain(role, requested, responsibilities, picture, hypothesis),
    responsibilities,
    requestedHours: requestedHours(record),
    workloadStatement: workloadStatement(record),
    staffing: staffingConsiderations(record),
    assumptions: assumptions(record, picture, hypothesis),
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
    : 'The role below is the leading recommendation. Any hours shown are a partial workload reading, not a complete weekly requirement.';
  return { headline: recommendation.headline, status, sections };
}

function chooseRole(hypothesis: SupportHypothesis, finance: boolean): RecommendedRole | null {
  if (hypothesis.primary === 'uncertain') return finance ? 'Operations Coordinator' : null;
  if (hypothesis.blend) return 'Blended arrangement';
  if (hypothesis.primary === 'project') return 'Project Support';
  if (hypothesis.primary === 'operations') return 'Operations Coordinator';
  return 'Executive Assistant';
}

function headlineFor(role: RecommendedRole, hypothesis: SupportHypothesis): string {
  if (role === 'Executive Assistant' && (hypothesis.chaseAlongsideExecutive || hypothesis.project > 0)) {
    return 'Experienced Executive Assistant, including client and project coordination';
  }
  if (role === 'Executive Assistant') return 'Experienced Executive Assistant';
  if (role === 'Project Support' && hypothesis.autonomy === 'direct') return 'Project management support';
  if (role === 'Project Support') return 'Project Coordinator / Project Support';
  if (role === 'Operations Coordinator') return 'Operations Coordinator';
  if (hypothesis.blend?.includes('operations') && hypothesis.blend.includes('project')) {
    return 'Project and operations coordination in one remit';
  }
  return 'Executive and project support in one remit';
}

function explain(
  role: RecommendedRole,
  requested: string | null | undefined,
  responsibilities: string[],
  picture: WorkPicture,
  hypothesis: SupportHypothesis,
): string {
  const work = responsibilities.join('; ');
  if (role === 'Blended arrangement') {
    const remit = blendNames(hypothesis.blend);
    return `The brief covers ${remit}: ${work}. That is one blended remit. It does not decide whether one person or more than one person is needed, and staffing is left for later.`;
  }
  if (role === 'Project Support') {
    const asked = requested === 'Executive Assistant' ? 'You asked for an Executive Assistant. The requested title does not decide the role. ' : '';
    const seniority =
      hypothesis.autonomy === 'direct'
        ? 'They would direct delivery or manage the people doing the work, so this sits above day-to-day coordination.'
        : 'This is read as coordination. Directing delivery or managing project staff would change the seniority, not the purpose.';
    return `${asked}The primary purpose is coordinating project and client delivery: ${work}. ${seniority}`;
  }
  if (role === 'Operations Coordinator') {
    if (picture.specialistFinance && hypothesis.operations < 3) {
      return `The brief is ${work}. That is one role. Bookkeeping is specialist work, it has no approved hour rate, and on this evidence it does not require a second person.`;
    }
    return `The primary purpose is recurring operational coordination: ${work}. This is one remit. It does not decide how many people are needed.`;
  }
  const asked = requested === 'Executive Assistant' ? 'You asked for an Executive Assistant. ' : '';
  const finance = picture.specialistFinance
    ? ' Bookkeeping or invoicing is specialist work inside this same brief. It does not create a second role, and it has no approved hour rate.'
    : '';
  return `${asked}The described work — ${work} — sits within an experienced Executive Assistant brief. Routine client and project coordination stays inside that brief. A second role is not indicated.${finance}`;
}

function blendNames(blend: PurposeArea[] | null): string {
  const names = new Set(blend ?? []);
  if (names.has('project') && names.has('operations')) return 'project coordination and recurring operational work';
  if (names.has('executive') && names.has('operations')) return 'executive support and operational coordination';
  return 'executive support and project coordination';
}

function responsibilityLines(record: AssessmentRecord, picture: WorkPicture, hypothesis: SupportHypothesis): string[] {
  const duties = record.executive.responsibilities.value ?? [];
  const evidence = (record.workload.evidence ?? []).map((note) => note.text).join(' ');
  const lines = [...hypothesis.responsibilities];
  const executiveMeetings = !hypothesis.projectMeetings || hypothesis.ownDiary;
  const meetingsNamed = /about \d+ meetings/i.test(evidence) || duties.some((duty) => /meeting/i.test(duty));
  if (executiveMeetings && meetingsNamed && !lines.some((line) => /meetings/i.test(line))) {
    if (picture.meetingNature === 'attend') lines.push('Attending meetings');
    else if (picture.meetingNature === 'schedule') lines.push('Scheduling meetings');
    else if (picture.meetingNature === 'both') lines.push('Attending and scheduling meetings');
    else lines.push('Meetings, still to be distinguished between attending and scheduling');
  }
  if (picture.projectDepth === 'management' && !lines.some((line) => /direct|project management|projects/i.test(line))) {
    lines.push('Directing project delivery');
  }
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
  return `No weekly range has been calculated, because no approved benchmark matches the work described, and no allowance has been invented. ${OUTSTANDING_RANGE}`;
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

function assumptions(record: AssessmentRecord, picture: WorkPicture, hypothesis: SupportHypothesis): string[] {
  const evidence = (record.workload.evidence ?? []).map((note) => note.text).join(' ');
  const items = [...hypothesis.uncertainties];
  if (/about \d+ meetings/i.test(evidence) && picture.meetingNature === 'unknown' && !hypothesis.projectMeetings) {
    items.push('Whether the meetings are attended or scheduled is still open. That can change the workload reading and the coverage.');
  }
  if (/about \d+ emails/i.test(evidence) && !picture.emailHandlingDescribed) {
    items.push('What the assistant has to do with the emails is still open. The number alone does not determine the workload, and no time allowance is applied unless an approved benchmark matches.');
  }
  const hoursKnown = Boolean(record.workload.requestedTime.value ?? record.workload.activeTime.value);
  if (hoursKnown && !record.availability.window.value && !record.availability.workingDays.value) {
    items.push('Availability has not been discussed. Active working hours are separate from being reachable throughout the day.');
  }
  return [...new Set(items)];
}
