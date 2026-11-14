import { hasBusinessNarrative, nextQuestionId } from './coverage';
import {
  createEmptyRecord,
  explicitFact,
  type AssessmentRecord,
  type AssessmentSession,
  type ChatMessage,
  type StaffingModel,
  type TopicId,
  type WorkLocation,
} from './types';

/**
 * Phase 2 guided conversation.
 * Phase 3 should replace `interpret` with Gemini. This file must not call an API,
 * invent workload figures, or recommend a staffing model.
 */

const WELCOME =
  "To start, could you tell me a little about your business and what's prompted you to look for operational support?";

const QUESTIONS: Record<string, { topic: TopicId; text: (record: AssessmentRecord) => string }> = {
  business: { topic: 'business', text: () => WELCOME },
  support: {
    topic: 'support',
    text: () =>
      'Which parts of the work are taking the time: executive administration such as the diary and inbox, project support, day-to-day operational coordination, or a mix?',
  },
  workload: {
    topic: 'workload',
    text: () =>
      'Roughly how much active working time do these tasks take in a normal week? If some of it is only occasional, or you are not sure of a figure, say so. I will not fill in a number for you.',
  },
  availability: {
    topic: 'availability',
    text: () =>
      'Separately from those working hours, when would someone need to be available? A business can have 10 hours of work and still need someone reachable across the week.',
  },
  staffing: {
    topic: 'staffing',
    text: (record) => {
      if (record.staffing.model.value && !record.staffing.location.value) {
        return 'Would that person work remotely, on site, or a mix of the two?';
      }
      if (!record.staffing.model.value && record.staffing.location.value) {
        return 'Are you leaning towards outsourced support, hiring someone into the business, or are you still comparing the two?';
      }
      return 'Are you leaning towards outsourced support, hiring someone into the business, or are you still comparing the two? And would they work remotely, on site, or a mix?';
    },
  },
  process: {
    topic: 'process',
    text: () =>
      'Are there tasks that feel manual or duplicated, and might be improved in a system rather than by adding a person? You can skip this.',
  },
  close: {
    topic: 'review',
    text: () => 'Is there anything you would like to correct or add before we close this conversation?',
  },
};

const COMPLETION =
  "That's as far as this conversation needs to go. I've recorded what you told me. A later phase will turn this into a recommendation. I have not estimated workload, suggested how to staff it, or calculated a cost.";

export function createSession(openingNote: string | null): AssessmentSession {
  const record = createEmptyRecord();
  const opening = openingNote?.trim() ?? '';
  if (!opening) {
    return {
      version: 1,
      openingNote: '',
      messages: [{ id: 'm1', role: 'assistant', text: WELCOME }],
      record,
      asked: ['business'],
      pending: 'business',
      complete: false,
    };
  }

  const seeded = interpret(record, opening, 'business');
  const pending = nextQuestionId(seeded, ['business']);
  const acknowledgement = acknowledge(record, seeded) || "I'll start from what you've written.";
  const followUp = pending ? QUESTIONS[pending].text(seeded) : COMPLETION;
  const assistant = [acknowledgement, followUp].filter(Boolean).join(' ');

  return {
    version: 1,
    openingNote: opening,
    messages: [
      { id: 'm1', role: 'visitor', text: opening },
      { id: 'm2', role: 'assistant', text: assistant },
    ],
    record: seeded,
    asked: pending ? ['business', pending] : ['business'],
    pending,
    complete: pending === null,
  };
}

export function replyTo(session: AssessmentSession, rawText: string): AssessmentSession {
  const text = rawText.trim();
  if (!text || session.complete || !session.pending) return session;

  const visitor: ChatMessage = { id: nextMessageId(session.messages), role: 'visitor', text };
  const before = session.record;
  const interpreted = interpret(before, text, QUESTIONS[session.pending].topic);
  const pendingId = session.pending;

  if ((pendingId === 'process' || pendingId === 'close') && isDecline(text)) {
    interpreted.statements = interpreted.statements.slice(0, -1);
    if (pendingId === 'process') interpreted.process.skipped = true;
  } else if (
    pendingId === 'process' &&
    !hasProcessContent(text) &&
    interpreted.workload.activeTime.value !== before.workload.activeTime.value
  ) {
    const latest = interpreted.statements[interpreted.statements.length - 1];
    if (latest) latest.topic = 'workload';
    interpreted.process.skipped = true;
  }
  if (pendingId === 'workload' && isUnsure(text) && !interpreted.workload.activeTime.value) {
    interpreted.workload.uncertainty = explicitFact('You said a working-time figure is not known yet.', text);
  }
  if (pendingId === 'staffing' && !interpreted.staffing.model.value && (isUnsure(text) || /\b(both|either)\b/i.test(text))) {
    interpreted.staffing.model = explicitFact(/\b(both|either)\b/i.test(text) ? 'comparing' : 'unsure', text);
  }
  if (pendingId === 'staffing' && !interpreted.staffing.location.value && /\bmix\b/i.test(text)) {
    interpreted.staffing.location = explicitFact('hybrid', text);
  }

  const asked = session.asked.includes(pendingId) ? session.asked : [...session.asked, pendingId];
  const finishing = pendingId === 'close';
  const next = finishing ? null : nextQuestionId(interpreted, asked);
  const acknowledgement = acknowledge(before, interpreted, text, pendingId);
  const followUp = next ? QUESTIONS[next].text(interpreted) : COMPLETION;
  const assistantText = [acknowledgement, followUp].filter(Boolean).join(' ');

  return {
    ...session,
    messages: [...session.messages, visitor, { id: nextMessageId([...session.messages, visitor]), role: 'assistant', text: assistantText }],
    record: interpreted,
    asked: next ? [...asked, next] : asked,
    pending: next,
    complete: next === null,
  };
}

function interpret(record: AssessmentRecord, text: string, topic: TopicId): AssessmentRecord {
  const next = cloneRecord(record);
  next.statements = [
    ...next.statements,
    { id: `s${next.statements.length + 1}`, topic, text, source: 'explicit', confidence: 'high' },
  ];
  applySignals(next, text);
  return next;
}

function applySignals(record: AssessmentRecord, text: string): void {
  const executive = matchLabels(text, EXECUTIVE_SIGNALS);
  if (executive.length) {
    record.executive.mentioned = true;
    record.executive.responsibilities = mergeLabels(record.executive.responsibilities.value, executive, text);
  }

  const project = matchLabels(text, PROJECT_SIGNALS);
  if (project.length) {
    record.project.mentioned = true;
    record.project.notes = mergeLabels(record.project.notes.value, project, text);
  }
  const projectCount = text.match(/\b(\d{1,3})\s+(?:active\s+)?projects?\b/i);
  if (projectCount) {
    record.project.mentioned = true;
    record.project.activeProjects = explicitFact(`${projectCount[1]} projects`, text, Boolean(record.project.activeProjects.value));
  }

  const operations = matchLabels(text, OPERATIONS_SIGNALS);
  if (operations.length) {
    record.operations.mentioned = true;
    record.operations.notes = mergeLabels(record.operations.notes.value, operations, text);
  }

  const sector = matchFirst(text, SECTOR_SIGNALS);
  if (sector) record.business.sector = explicitFact(sector, text, Boolean(record.business.sector.value));

  const size = matchSize(text);
  if (size) record.business.size = explicitFact(size, text, Boolean(record.business.size.value));

  const activeTime = matchActiveTime(text);
  if (activeTime) {
    const revised = Boolean(record.workload.activeTime.value && record.workload.activeTime.value !== activeTime);
    record.workload.activeTime = explicitFact(activeTime, text, revised);
    record.workload.uncertainty = { value: null, source: 'unknown', confidence: 'none' };
  }

  if (/\b(each week|every week|weekly|recurring|regular)\b/i.test(text)) {
    record.workload.pattern = explicitFact('Regular or weekly', text, Boolean(record.workload.pattern.value));
  } else if (/\b(occasional|ad hoc|adhoc|now and then|from time to time)\b/i.test(text)) {
    record.workload.pattern = explicitFact('Some of the work is occasional', text, Boolean(record.workload.pattern.value));
  }

  if (/\b(peak|busier|quarter[- ]end|month[- ]end|year[- ]end)\b/i.test(text)) {
    record.workload.peak = explicitFact('You described busier periods as well as the normal week.', text);
  }

  const days = matchWorkingDays(text);
  if (days) record.availability.workingDays = explicitFact(days, text, Boolean(record.availability.workingDays.value));

  const window = matchAvailabilityWindow(text);
  if (window) record.availability.window = explicitFact(window, text, Boolean(record.availability.window.value));

  if (/\b(urgent|same day|time[- ]sensitive|as soon as)\b/i.test(text)) {
    record.availability.timeSensitive = explicitFact('Some work is time-sensitive.', text);
  }
  if (/\b(dedicated|solely|only for us|just for us)\b/i.test(text)) {
    record.availability.dedicatedCover = explicitFact('You mentioned dedicated cover.', text);
  }
  if (/\b(holiday|annual leave|when (?:i am|i'm|we are|we're) (?:away|off|on leave))\b/i.test(text)) {
    record.availability.holidayCover = explicitFact('You mentioned cover during absence.', text);
  }

  const model = matchStaffingModel(text);
  if (model) record.staffing.model = explicitFact(model, text, Boolean(record.staffing.model.value));

  const location = matchLocation(text);
  if (location) record.staffing.location = explicitFact(location, text, Boolean(record.staffing.location.value));

  const budget = text.match(/£\s?\d[\d,]*(?:\s?(?:k|per hour|an hour|\/hour))?/i);
  if (budget) record.staffing.budget = explicitFact(budget[0].replace(/\s+/g, ' '), text, Boolean(record.staffing.budget.value));

  if (/\b(as soon as possible|asap|next month|immediately|from \w+)\b/i.test(text) && /\b(start|begin|need someone)\b/i.test(text)) {
    record.staffing.startDate = explicitFact('You mentioned a preferred start.', text);
  }

  const systems = matchLabels(text, SYSTEM_SIGNALS);
  if (systems.length) record.process.systems = mergeLabels(record.process.systems.value, systems, text);
  if (/\b(manual|duplicat\w*|copy(?:ing)? and past\w*|spreadsheet)\b/i.test(text)) {
    record.process.manualWork = explicitFact('You described manual or duplicated work.', text);
  }
}

function acknowledge(before: AssessmentRecord, after: AssessmentRecord, text = '', pending = ''): string {
  if ((pending === 'process' || pending === 'close') && isDecline(text)) {
    return pending === 'close' ? '' : "We'll leave process improvement for now.";
  }

  const notes: string[] = [];
  if (after.workload.activeTime.value && after.workload.activeTime.value !== before.workload.activeTime.value) {
    notes.push(
      after.workload.activeTime.revised
        ? `I've updated the active working time to ${after.workload.activeTime.value}.`
        : `I've noted ${after.workload.activeTime.value} of active work.`,
    );
  } else if (pending === 'workload' && after.workload.uncertainty.value && !before.workload.uncertainty.value) {
    notes.push("I've left the working time blank, because a figure was not given.");
  }

  if (after.availability.window.value && after.availability.window.value !== before.availability.window.value) {
    notes.push("I've kept when someone needs to be available separate from the hours of work.");
  } else if (after.availability.workingDays.value && after.availability.workingDays.value !== before.availability.workingDays.value) {
    notes.push("I've noted the days someone would need to be available, separately from the hours of work.");
  }

  const newLabels = newResponsibilityLabels(before, after);
  if (newLabels.length) notes.push(`I've noted ${joinLabels(newLabels)}.`);

  if (after.staffing.model.value && after.staffing.model.value !== before.staffing.model.value) {
    notes.push(
      after.staffing.model.value === 'comparing'
        ? "I've noted that you are still comparing outsourced support and hiring."
        : `I've noted a preference for ${after.staffing.model.value === 'outsourced' ? 'outsourced support' : after.staffing.model.value === 'permanent' ? 'hiring' : 'leaving the approach open'}.`,
    );
  }

  if (notes.length === 0) {
    if (!hasBusinessNarrative(before) && hasBusinessNarrative(after)) return "I'll start from what you've described.";
    return "I've kept that as you described it.";
  }
  return notes.slice(0, 2).join(' ');
}

function newResponsibilityLabels(before: AssessmentRecord, after: AssessmentRecord): string[] {
  const previous = new Set([
    ...(before.executive.responsibilities.value ?? []),
    ...(before.project.notes.value ?? []),
    ...(before.operations.notes.value ?? []),
  ]);
  return [
    ...(after.executive.responsibilities.value ?? []),
    ...(after.project.notes.value ?? []),
    ...(after.operations.notes.value ?? []),
  ].filter((label) => !previous.has(label));
}

function joinLabels(labels: string[]): string {
  const readable = labels.map((label) => label.toLowerCase());
  if (readable.length === 1) return readable[0];
  return `${readable.slice(0, -1).join(', ')} and ${readable[readable.length - 1]}`;
}

function matchActiveTime(text: string): string | null {
  const range = text.match(
    /\b(\d{1,2})\s*(?:-|–|to)\s*(\d{1,2})\s*hours?(?:\s*(?:a|per|each)\s*week)?\b/i,
  );
  const single = text.match(/\b(\d{1,2})\s*hours?(?:\s*(?:a|per|each)\s*week)?\b/i);
  const match = range ?? single;
  if (!match) return null;
  const clause = clauseAround(text, match.index ?? 0);
  const aboutAvailability = /\b(available|availability|reachable|on hand|cover(?:ing)?|in the office)\b/i.test(clause);
  const aboutWork = /\b(work|tasks?|spend|spending|takes|taking|admin|doing)\b/i.test(clause);
  if (aboutAvailability && !aboutWork) return null;
  if (range) return `${range[1]}–${range[2]} hours a week`;
  return `${single![1]} hours a week`;
}

function matchAvailabilityWindow(text: string): string | null {
  const clock = text.match(
    /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|–|to)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i,
  );
  if (clock && /\b(available|availability|reachable|cover|office hours|working day)\b/i.test(text)) {
    return `${clock[1].replace(/\s+/g, '')}–${clock[2].replace(/\s+/g, '')}`;
  }
  if (/\bfull[- ]time\b/i.test(text)) return 'Full-time availability';
  if (/\bpart[- ]time\b/i.test(text) && /\b(available|availability|cover|in the office)\b/i.test(text)) {
    return 'Part-time availability';
  }
  if (/\b(office hours|working hours|throughout the (?:day|week)|during the working day)\b/i.test(text)) {
    return 'Across the working day';
  }
  return null;
}

function matchWorkingDays(text: string): string | null {
  if (/\bmonday\s*(?:to|–|-)\s*friday\b|\bweekdays\b|\bmon(?:day)?\s*[-–]\s*fri(?:day)?\b/i.test(text)) {
    return 'Monday to Friday';
  }
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].filter((day) =>
    new RegExp(`\\b${day}\\b`, 'i').test(text),
  );
  if (days.length >= 2) return days.join(', ');
  return null;
}

function matchStaffingModel(text: string): StaffingModel | null {
  const outsourced = /\b(outsourc\w*|virtual assistant|retainer|external support)\b/i.test(text);
  const permanent = /\b(permanent|on the payroll|employee|employing|hire someone|hiring)\b/i.test(text);
  if (outsourced && permanent && !/\bvirtual assistant\b/i.test(text)) return 'comparing';
  if (outsourced) return 'outsourced';
  if (permanent) return 'permanent';
  if (/\b(still deciding|still comparing|comparing the two)\b/i.test(text)) return 'comparing';
  return null;
}

function matchLocation(text: string): WorkLocation | null {
  const remote = /\b(remote(?:ly)?|from home|work from home|virtual)\b/i.test(text);
  const onSite = /\b(on[- ]?site|in the office|in our office|on the premises)\b/i.test(text);
  const hybrid = /\bhybrid\b/i.test(text);
  if (hybrid || (remote && onSite)) return 'hybrid';
  if (remote) return 'remote';
  if (onSite) return 'on-site';
  return null;
}

function matchSize(text: string): string | null {
  const people = text.match(/\b(\d{1,4})\s*(?:people|persons?|staff|employees|fee[- ]earners)\b/i);
  if (people) return `${people[1]} people`;
  if (/\b(sole trader|just me|only me|founder only|one[- ]person)\b/i.test(text)) return 'Founder-led';
  return null;
}

function matchLabels(text: string, signals: Signal[]): string[] {
  return signals.filter((signal) => signal.pattern.test(text)).map((signal) => signal.label);
}

function matchFirst(text: string, signals: Signal[]): string | null {
  return signals.find((signal) => signal.pattern.test(text))?.label ?? null;
}

function mergeLabels(
  current: string[] | null,
  labels: string[],
  evidence: string,
): AssessmentRecord['executive']['responsibilities'] {
  const merged = [...new Set([...(current ?? []), ...labels])];
  return explicitFact(merged, evidence, Boolean(current?.length));
}

function clauseAround(text: string, index: number): string {
  const start = Math.max(0, text.lastIndexOf('.', index), text.lastIndexOf(';', index), text.lastIndexOf(',', index));
  const endCandidates = [text.indexOf('.', index), text.indexOf(';', index), text.indexOf(',', index)].filter((end) => end >= 0);
  const end = endCandidates.length ? Math.min(...endCandidates) : text.length;
  return text.slice(start, end);
}

function hasProcessContent(text: string): boolean {
  return /\b(manual|duplicat\w*|software|system|automat\w*|spreadsheet|xero|quickbooks|freeagent|crm)\b/i.test(text);
}

function isDecline(text: string): boolean {
  const normalised = text.trim().toLowerCase().replace(/[.!]+$/g, '');
  return /^(no|nope|nothing|nothing else|skip|n\/a|na|not sure|no thanks|that'?s all|that'?s everything|that is all|all good|i'?m good|no i'?m good)$/.test(
    normalised,
  );
}

function isUnsure(text: string): boolean {
  return /\b(not sure|don'?t know|do not know|no idea|hard to say|can'?t say|unknown)\b/i.test(text);
}

function nextMessageId(messages: ChatMessage[]): string {
  return `m${messages.length + 1}`;
}

function cloneRecord(record: AssessmentRecord): AssessmentRecord {
  return JSON.parse(JSON.stringify(record)) as AssessmentRecord;
}

interface Signal {
  pattern: RegExp;
  label: string;
}

const EXECUTIVE_SIGNALS: Signal[] = [
  { pattern: /\bdiar(?:y|ies)\b/i, label: 'Diary management' },
  { pattern: /\bcalendar\b/i, label: 'Calendar management' },
  { pattern: /\binbox\b|\bemails?\b/i, label: 'Inbox management' },
  { pattern: /\bminutes?\b|\bminute[- ]taking\b/i, label: 'Meeting minutes' },
  { pattern: /\btravel\b/i, label: 'Travel coordination' },
  { pattern: /\bschedul\w*\b/i, label: 'Scheduling' },
];

const PROJECT_SIGNALS: Signal[] = [
  { pattern: /\bprojects?\b/i, label: 'Project support' },
  { pattern: /\bmilestones?\b/i, label: 'Milestone tracking' },
  { pattern: /\baction (?:log|tracking|follow[- ]?up)\b/i, label: 'Action tracking' },
  { pattern: /\bstakeholders?\b/i, label: 'Stakeholder coordination' },
  { pattern: /\bchas(?:e|ing)\b/i, label: 'Chasing and follow-up' },
];

const OPERATIONS_SIGNALS: Signal[] = [
  { pattern: /\bonboarding\b/i, label: 'Client onboarding' },
  { pattern: /\bsuppliers?\b/i, label: 'Supplier coordination' },
  { pattern: /\binvoic(?:e|es|ing)\b|\bpayment follow[- ]?ups?\b/i, label: 'Invoicing and payment follow-up' },
  { pattern: /\brecruitment admin\b/i, label: 'Recruitment administration' },
  { pattern: /\bcrm\b/i, label: 'CRM administration' },
];

const SECTOR_SIGNALS: Signal[] = [
  { pattern: /\b(solicitor|law firm|barrister|legal)\b/i, label: 'Legal' },
  { pattern: /\baccountan\w*\b/i, label: 'Accountancy' },
  { pattern: /\bconsultan\w*\b/i, label: 'Consulting' },
  { pattern: /\b(architect\w*|surveyor\w*)\b/i, label: 'Property and construction' },
  { pattern: /\b(financial advis\w*|wealth)\b/i, label: 'Financial services' },
  { pattern: /\b(charity|non[- ]profit)\b/i, label: 'Charity' },
];

const SYSTEM_SIGNALS: Signal[] = [
  { pattern: /\b(xero|quickbooks|freeagent)\b/i, label: 'Accounting software' },
  { pattern: /\b(salesforce|hubspot)\b/i, label: 'CRM' },
  { pattern: /\b(asana|monday\.com|trello|jira)\b/i, label: 'Project tool' },
  { pattern: /\b(outlook|gmail|google workspace|microsoft 365)\b/i, label: 'Email and calendar system' },
];
