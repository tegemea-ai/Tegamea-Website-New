import type { AssessmentRecord } from '../types';

export type PurposeArea = 'executive' | 'project' | 'operations';

/**
 * Recomputed from the whole record on every turn.
 * A requested job title and an early statement can be revised by later evidence.
 * Scores describe purpose. They are not hours.
 */
export interface SupportHypothesis {
  executive: number;
  project: number;
  operations: number;
  primary: PurposeArea | 'uncertain';
  /** Two substantial purposes. This is the remit, not a headcount. */
  blend: PurposeArea[] | null;
  autonomy: 'coordinate' | 'direct' | 'unknown';
  projectMeetings: boolean;
  ownDiary: boolean;
  describedAsRoutine: boolean;
  chaseAlongsideExecutive: boolean;
  responsibilities: string[];
  systems: string[];
  uncertainties: string[];
  /** In the order they should be asked. Empty when none would change the reading. */
  materialQuestions: string[];
}

const SUBSTANTIAL = 3;
const AMOUNT = 'one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\\d{1,4}';

export function hypothesisFrom(record: AssessmentRecord): SupportHypothesis {
  const spoken = (record.statements ?? []).map((statement) => statement.text).join('\n');
  const inboxWithdrawn = dutyWithdrawn(spoken, /\binbox\b|\bemails?\b/i);
  const diaryWithdrawn = dutyWithdrawn(spoken, /\bdiar/i);
  const duties = record.executive.responsibilities.value ?? [];
  const notes = record.project.notes.value ?? [];
  const operations = record.operations.notes.value ?? [];
  const storedSystems = record.process.systems.value ?? [];
  const labelled = [...duties, ...notes, ...operations, ...storedSystems].join('\n');
  const text = `${spoken}\n${labelled}`;

  const ownDiary =
    !diaryWithdrawn && (duties.some((duty) => /diary|calendar/i.test(duty)) || /\b(my diary|diary management|diaries)\b/i.test(spoken));
  const projectMeetings =
    /\bproject meetings?\b/i.test(spoken) ||
    (/\b(arrang\w+|schedul\w+)\b/i.test(spoken) && /\bmeetings?\b/i.test(spoken) && /\bprojects?\b/i.test(spoken) && !ownDiary);
  const describedAsRoutine =
    /\broutine\b[\s\S]{0,60}\b(chas|follow|action|track|coordinat)/i.test(spoken) ||
    /\boccasional(?:ly)?\b[\s\S]{0,50}\b(chas|follow|action)/i.test(spoken);
  const chaseWords = /\b(chas(?:e|ing)|follow(?:ing)?\s+up|action tracking)\b/i.test(spoken);
  const projectPurpose =
    /\bcoordinat\w+\b(?:\s+\w+){0,6}\s+projects?\b/i.test(spoken) ||
    /\bproject coordinat/i.test(spoken) ||
    /\b(plan and run|actively manage)\b[\s\S]{0,50}\bprojects?\b/i.test(spoken) ||
    /\bmanage (?:the |those |these )?projects\b/i.test(spoken);
  const accounts = /\bclient accounts?\b/i.test(spoken);
  const scale = scaleOf(spoken);
  const deadlines = /\b(deadlines?|milestones?|deliverables?)\b/i.test(spoken);
  const progress = /\b(project progress|tracking progress)\b/i.test(spoken);
  const projectComms = /\b(project[- ]leads?|client and project)\b/i.test(spoken) && /\b(communicat|coordinat)/i.test(spoken);
  const actions = /\bactions?\b|\baction tracking\b/i.test(spoken);
  const escalation = /\bescalat/i.test(spoken);
  const tool = /\b(asana|monday\.com|trello|jira)\b/i.test(text);

  let executive = 0;
  if (!inboxWithdrawn && (/\binbox\b|\bemails?\b/i.test(text))) executive += 3;
  if (ownDiary) executive += 3;
  if (/\bcorrespondence\b/i.test(spoken)) executive += 2;
  if (/\bclient meetings?\b/i.test(spoken) && !projectMeetings) executive += 2;
  if (duties.some((duty) => /document/i.test(duty))) executive += 1;
  if (record.executive.requestedRole?.value === 'Executive Assistant') executive += 1;

  let project = 0;
  if (projectPurpose) project += 3;
  if (accounts) project += 2;
  if (scale) project += 2;
  if (deadlines || progress) project += 2;
  if (projectComms) project += 1;
  if (projectMeetings) project += 1;
  if (tool) project += 1;
  if (escalation) project += 1;
  if (actions && (projectPurpose || accounts || scale)) project += 1;
  if (describedAsRoutine && executive >= SUBSTANTIAL) project = Math.min(project, 2);

  let operationsScore = 0;
  if (/\bonboarding\b/i.test(text)) operationsScore += 3;
  if (/\bsuppliers?\b/i.test(text)) operationsScore += 3;
  if (/\b(recurring|day-to-day|day to day)\b[\s\S]{0,40}\b(workflow|process|operational)/i.test(spoken) || /\boperational (workflows?|processes?|coordination)\b/i.test(spoken)) {
    operationsScore += 3;
  }
  if (/\bcrm\b/i.test(text)) operationsScore += 3;
  if (/\brecruitment admin/i.test(text)) operationsScore += 2;

  const autonomy = directsDelivery(spoken) ? 'direct' : /\bcoordinat/i.test(spoken) ? 'coordinate' : 'unknown';
  const ranked = [
    { area: 'executive' as const, score: executive },
    { area: 'project' as const, score: project },
    { area: 'operations' as const, score: operationsScore },
  ].sort((left, right) => right.score - left.score);
  const [top, second] = ranked;
  const blend = second.score >= SUBSTANTIAL && second.score * 2 >= top.score ? [top.area, second.area] : null;
  const primary: SupportHypothesis['primary'] = top.score >= SUBSTANTIAL ? top.area : 'uncertain';

  const chaseAlongsideExecutive = primary === 'executive' && !blend && (describedAsRoutine || chaseWords) && !projectPurpose;
  const finance = operations.some((note) => /bookkeep|invoic/i.test(note));
  const uncertainties: string[] = [];
  const materialQuestions: string[] = [];
  const projectLed = primary === 'project' || Boolean(blend?.includes('project'));
  const autonomyOpen = projectLed && !describedAsRoutine && autonomy !== 'direct' && !autonomyAnswered(spoken);
  if (autonomyOpen) {
    materialQuestions.push('project-autonomy');
    uncertainties.push(
      'Whether this person would only coordinate, or also direct delivery and manage people, is still open. That can change seniority. It does not decide how many people are needed.',
    );
  }
  if (projectLed && !scale && !describedAsRoutine) {
    materialQuestions.push('project-scale');
    uncertainties.push('The number of active accounts or projects was not stated. No time allowance has been assumed from it.');
  }
  if (projectMeetings && !ownDiary && !/\babout \d+(?:–\d+)? meetings\b/i.test((record.workload.evidence ?? []).map((note) => note.text).join(' '))) {
    uncertainties.push('Project meeting volume was not quantified. No scheduling allowance has been applied.');
  }
  if (finance) {
    uncertainties.push('Bookkeeping or invoicing stays outside the weekly range because there is no approved hour rate.');
  }
  if (chaseAlongsideExecutive) {
    uncertainties.push('Chasing and action tracking are part of this executive brief. A separate project-delivery responsibility would change the recommendation.');
  }

  const systems = namedSystems(text);
  return {
    executive,
    project,
    operations: operationsScore,
    primary,
    blend: top.score >= SUBSTANTIAL ? blend : null,
    autonomy,
    projectMeetings,
    ownDiary,
    describedAsRoutine,
    chaseAlongsideExecutive,
    responsibilities: retainedLines(record, {
      spoken,
      ownDiary,
      inboxWithdrawn,
      diaryWithdrawn,
      projectMeetings,
      describedAsRoutine,
      chaseWords,
      projectPurpose,
      scale,
      progress,
      deadlines,
      projectComms,
      actions,
      escalation,
      systems,
      operations,
      executiveLeads: executive >= SUBSTANTIAL && project < SUBSTANTIAL && !blend,
    }),
    systems,
    uncertainties,
    materialQuestions,
  };
}

function dutyWithdrawn(spoken: string, duty: RegExp): boolean {
  return spoken.split('\n').some((line) => duty.test(line) && /\b(ignore|drop|remove|no longer|not required)\b/i.test(line));
}

function autonomyAnswered(spoken: string): boolean {
  return /\b(only|just) coordinat/i.test(spoken) || /\bnot (?:direct|manag)/i.test(spoken) || /\bcoordinat\w*, not\b/i.test(spoken);
}

function directsDelivery(spoken: string): boolean {
  return spoken.split(/[.!?]/).some((clause) => {
    if (/\b(not|n't|never|without|no)\b/i.test(clause)) return false;
    return /\b(plan and run|actively manage|manage(?:s|ing)? (?:a |the )?(?:project coordinator|other support staff|support staff|people|project staff)|direct(?:s|ing)? (?:the )?delivery)\b/i.test(
      clause,
    );
  });
}

function scaleOf(spoken: string): string | null {
  const match = spoken.match(
    new RegExp(`\\b(?:about|approximately|around|roughly)?\\s*(${AMOUNT})\\s+((?:active\\s+|client\\s+|live\\s+){0,3}(?:accounts?|projects?))\\b`, 'i'),
  );
  if (!match) return null;
  const noun = match[2].replace(/\s+/g, ' ').trim();
  return `About ${match[1].toLowerCase()} ${noun}`;
}

function namedSystems(text: string): string[] {
  const names: Array<[string, RegExp]> = [
    ['Asana', /\basana\b/i],
    ['Trello', /\btrello\b/i],
    ['Jira', /\bjira\b/i],
    ['Monday.com', /\bmonday\.com\b/i],
    ['Xero', /\bxero\b/i],
    ['QuickBooks', /\bquickbooks\b/i],
    ['Salesforce', /\bsalesforce\b/i],
    ['HubSpot', /\bhubspot\b/i],
  ];
  return names.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
}

function retainedLines(
  record: AssessmentRecord,
  facts: {
    spoken: string;
    ownDiary: boolean;
    inboxWithdrawn: boolean;
    diaryWithdrawn: boolean;
    projectMeetings: boolean;
    describedAsRoutine: boolean;
    chaseWords: boolean;
    projectPurpose: boolean;
    scale: string | null;
    progress: boolean;
    deadlines: boolean;
    projectComms: boolean;
    actions: boolean;
    escalation: boolean;
    systems: string[];
    operations: string[];
    executiveLeads: boolean;
  },
): string[] {
  const duties = record.executive.responsibilities.value ?? [];
  const lines: string[] = [];
  if (!facts.inboxWithdrawn && (duties.includes('Inbox management') || /\bemails?\b|\binbox\b/i.test(facts.spoken))) lines.push('Inbox management');
  if (facts.ownDiary && !facts.diaryWithdrawn) lines.push('Diary and scheduling');
  if (/\bcorrespondence\b/i.test(facts.spoken)) lines.push('Correspondence');
  if (duties.includes('Sending documents')) lines.push('Sending documents to clients');
  if (duties.includes('Document preparation')) lines.push('Document preparation');
  if (facts.executiveLeads && (facts.describedAsRoutine || facts.chaseWords)) {
    lines.push('Routine client follow-up and action tracking');
  }
  const projectDetail = facts.projectPurpose || facts.scale || facts.projectMeetings || facts.projectComms;
  if (projectDetail && !facts.describedAsRoutine) {
    if (facts.scale) lines.push(facts.scale);
    if (facts.progress) lines.push('Tracking project progress');
    if (facts.deadlines) lines.push('Monitoring deadlines');
    if (facts.projectComms) lines.push('Coordinating client and project-lead communications');
    if (facts.projectMeetings) lines.push('Coordinating project meetings');
    if (facts.actions || facts.escalation) {
      lines.push(facts.escalation ? 'Tracking actions and escalating issues' : 'Tracking actions');
    }
  } else if (facts.scale && facts.describedAsRoutine) {
    lines.push(facts.scale);
  }
  for (const system of facts.systems) {
    lines.push(system === 'Asana' ? 'Asana as the project system' : `${system} as a system they use`);
  }
  for (const note of facts.operations) {
    if (/bookkeep|invoic/i.test(note)) lines.push(note);
    else if (/onboarding/i.test(note)) lines.push('Client onboarding');
    else if (/supplier/i.test(note)) lines.push('Supplier coordination');
    else lines.push(note);
  }
  if (/\b(recurring|day-to-day|day to day)\b[\s\S]{0,40}\b(workflow|process|operational)/i.test(facts.spoken) || /\boperational (workflows?|processes?)\b/i.test(facts.spoken)) {
    lines.push('Recurring operational workflows');
  }
  return unique(lines);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
