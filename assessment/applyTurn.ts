import { essentialGaps, type EssentialGap } from './coverage';
import {
  createEmptyRecord,
  explicitFact,
  inferredFact,
  unknownFact,
  type AssessmentRecord,
  type Fact,
  type FactSource,
  type StaffingModel,
  type Statement,
  type TopicId,
  type WorkLocation,
} from './types';
import {
  readWorkingTime,
  sameWorkingTime,
  statedUnitCorrection,
  workingTimeChanged,
  workingTimeFromParts,
} from './workingTime';

export const MAX_MESSAGES = 40;
export const MAX_MESSAGE_CHARS = 2000;
export const MAX_VISITOR_TURNS = 24;
export const MAX_BODY_CHARS = 80_000;

const SAFE_CLOSE =
  "That's enough for this stage. A later phase will turn this into a recommendation. I haven't suggested how to staff it or calculated a cost.";

const GAP_QUESTION: Record<EssentialGap, string> = {
  business:
    "Could you tell me a little about your business, and what's prompted you to look for operational support?",
  support: 'Which parts of the work are taking the time?',
  workload:
    'Roughly how much active working time does this take, and is that per day or per week? If you are not sure of a number, say so.',
  schedule: "How many days a week does that apply to? I won't assume a five-day week.",
  availability: 'Separately from those working hours, when would someone need to be available?',
  staffing: 'Are you leaning towards outsourced support, hiring someone, or are you still comparing the two?',
};

const BLOCKED_REPLY = /£|\$\s?\d|\bper hour\b|\bi recommend\b|\brecruitment fee\b|\bon-?costs?\b|\bsalary\b/i;

export interface ModelTurn {
  assistantMessage: string;
  suggestComplete: boolean;
  business: {
    sector: string | null;
    nature: string | null;
    size: string | null;
    challenges: string | null;
    correction: boolean;
  };
  executive: { responsibilities: string[]; correction: boolean };
  project: { notes: string[]; activeProjects: string | null; correction: boolean };
  operations: { notes: string[]; correction: boolean };
  workingTime: {
    amount: number | null;
    amountTo: number | null;
    unit: 'day' | 'week' | null;
    daysPerWeek: number | null;
    unknown: boolean;
    pattern: string | null;
    peak: string | null;
    correction: boolean;
  };
  availability: {
    window: string | null;
    workingDays: string | null;
    timeSensitive: boolean;
    dedicatedCover: boolean;
    holidayCover: boolean;
    unknown: boolean;
    correction: boolean;
  };
  staffing: {
    model: StaffingModel | null;
    location: WorkLocation | null;
    budget: string | null;
    continuity: string | null;
    manageEmployee: string | null;
    startDate: string | null;
    existingSupport: string | null;
    constraints: string | null;
    correction: boolean;
  };
  process: {
    manualWork: string | null;
    automation: string | null;
    systems: string[];
    skipped: boolean;
  };
}

export interface AppliedTurn {
  record: AssessmentRecord;
  asked: string[];
  pending: string | null;
  complete: boolean;
  assistantMessage: string;
}

export function blankModelTurn(assistantMessage = ''): ModelTurn {
  return {
    assistantMessage,
    suggestComplete: false,
    business: { sector: null, nature: null, size: null, challenges: null, correction: false },
    executive: { responsibilities: [], correction: false },
    project: { notes: [], activeProjects: null, correction: false },
    operations: { notes: [], correction: false },
    workingTime: {
      amount: null,
      amountTo: null,
      unit: null,
      daysPerWeek: null,
      unknown: false,
      pattern: null,
      peak: null,
      correction: false,
    },
    availability: {
      window: null,
      workingDays: null,
      timeSensitive: false,
      dedicatedCover: false,
      holidayCover: false,
      unknown: false,
      correction: false,
    },
    staffing: {
      model: null,
      location: null,
      budget: null,
      continuity: null,
      manageEmployee: null,
      startDate: null,
      existingSupport: null,
      constraints: null,
      correction: false,
    },
    process: { manualWork: null, automation: null, systems: [], skipped: false },
  };
}

export function coerceModelTurn(value: unknown): ModelTurn {
  if (!value || typeof value !== 'object') throw new Error('empty model output');
  const raw = value as Record<string, unknown>;
  const message = typeof raw.assistantMessage === 'string' ? raw.assistantMessage.trim() : '';
  if (!message) throw new Error('empty model output');
  const business = object(raw.business);
  const executive = object(raw.executive);
  const project = object(raw.project);
  const operations = object(raw.operations);
  const workingTime = object(raw.workingTime);
  const availability = object(raw.availability);
  const staffing = object(raw.staffing);
  const process = object(raw.process);
  const unit = workingTime.unit === 'day' || workingTime.unit === 'week' ? workingTime.unit : null;
  const staffingModel = isStaffingModel(staffing.model) ? staffing.model : null;
  const location = isLocation(staffing.location) ? staffing.location : null;
  return {
    assistantMessage: message.slice(0, 1200),
    suggestComplete: raw.suggestComplete === true,
    business: {
      sector: text(business.sector, 80),
      nature: text(business.nature, 160),
      size: text(business.size, 40),
      challenges: text(business.challenges, 200),
      correction: business.correction === true,
    },
    executive: { responsibilities: textList(executive.responsibilities), correction: executive.correction === true },
    project: {
      notes: textList(project.notes),
      activeProjects: text(project.activeProjects, 40),
      correction: project.correction === true,
    },
    operations: { notes: textList(operations.notes), correction: operations.correction === true },
    workingTime: {
      amount: whole(workingTime.amount, 80),
      amountTo: whole(workingTime.amountTo, 80),
      unit,
      daysPerWeek: whole(workingTime.daysPerWeek, 7),
      unknown: workingTime.unknown === true,
      pattern: text(workingTime.pattern, 80),
      peak: text(workingTime.peak, 80),
      correction: workingTime.correction === true,
    },
    availability: {
      window: text(availability.window, 80),
      workingDays: text(availability.workingDays, 80),
      timeSensitive: availability.timeSensitive === true,
      dedicatedCover: availability.dedicatedCover === true,
      holidayCover: availability.holidayCover === true,
      unknown: availability.unknown === true,
      correction: availability.correction === true,
    },
    staffing: {
      model: staffingModel,
      location,
      budget: text(staffing.budget, 40),
      continuity: text(staffing.continuity, 120),
      manageEmployee: text(staffing.manageEmployee, 120),
      startDate: text(staffing.startDate, 80),
      existingSupport: text(staffing.existingSupport, 120),
      constraints: text(staffing.constraints, 160),
      correction: staffing.correction === true,
    },
    process: {
      manualWork: text(process.manualWork, 160),
      automation: text(process.automation, 160),
      systems: textList(process.systems),
      skipped: process.skipped === true,
    },
  };
}

export interface TurnRequest {
  messages: { role: 'assistant' | 'visitor'; text: string }[];
  record: AssessmentRecord;
  asked: string[];
}

export function parseTurnRequest(body: unknown): { ok: true; value: TurnRequest } | { ok: false; error: 'invalid' | 'too_large'; message: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'invalid', message: 'Send a written reply to continue.' };
  }
  const raw = body as { messages?: unknown; record?: unknown; asked?: unknown };
  if (!Array.isArray(raw.messages) || raw.messages.length === 0 || raw.messages.length > MAX_MESSAGES) {
    return { ok: false, error: 'too_large', message: 'This conversation has become too long to continue safely.' };
  }
  const messages: TurnRequest['messages'] = [];
  for (const item of raw.messages) {
    if (!item || typeof item !== 'object') return { ok: false, error: 'invalid', message: 'Send a written reply to continue.' };
    const role = (item as { role?: unknown }).role;
    const text = (item as { text?: unknown }).text;
    if ((role !== 'assistant' && role !== 'visitor') || typeof text !== 'string') {
      return { ok: false, error: 'invalid', message: 'Send a written reply to continue.' };
    }
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > MAX_MESSAGE_CHARS) {
      return { ok: false, error: 'too_large', message: 'Please keep each reply to a few paragraphs.' };
    }
    messages.push({ role, text: trimmed });
  }
  if (messages[messages.length - 1].role !== 'visitor') {
    return { ok: false, error: 'invalid', message: 'Send a written reply to continue.' };
  }
  const visitorTurns = messages.filter((message) => message.role === 'visitor').length;
  if (visitorTurns > MAX_VISITOR_TURNS) {
    return { ok: false, error: 'too_large', message: 'This conversation has become too long to continue safely.' };
  }
  return {
    ok: true,
    value: {
      messages,
      record: isRecord(raw.record) ? raw.record : createEmptyRecord(),
      asked: Array.isArray(raw.asked) ? raw.asked.filter((item): item is string => typeof item === 'string').slice(0, 40) : [],
    },
  };
}

export function applyModelTurn(record: AssessmentRecord, visitorText: string, model: ModelTurn, asked: string[]): AppliedTurn {
  const next = cloneRecord(record);
  const gapBefore = essentialGaps(next, asked)[0] ?? null;
  const text = visitorText.trim();

  next.statements = [
    ...next.statements,
    {
      id: `s${next.statements.length + 1}`,
      topic: topicForGap(gapBefore),
      text,
      source: 'explicit',
      confidence: 'high',
    } satisfies Statement,
  ];

  applyBusiness(next, text, model);
  applyLabels(next, text, model);
  applyWorkingTime(next, text, model, gapBefore);
  applyAvailability(next, text, model, gapBefore);
  applyStaffing(next, text, model);
  applyProcess(next, text, model);

  const nextAsked = [...asked];
  const remember = (id: string) => {
    if (!nextAsked.includes(id)) nextAsked.push(id);
  };
  if (gapBefore === 'schedule' && next.workload.activeTime.value?.needsClarification && isUnsure(text)) remember('schedule');
  if (gapBefore === 'availability' && (model.availability.unknown || isUnsure(text)) && !next.availability.window.value && !next.availability.workingDays.value) {
    remember('availability');
  }
  if (gapBefore === 'support' && isUnsure(text)) remember('support');
  if (gapBefore === 'staffing' && isUnsure(text) && !next.staffing.model.value) {
    next.staffing.model = explicitFact('unsure', text);
  }

  const gaps = essentialGaps(next, nextAsked);
  const visitorDone = isDone(text);
  const extras = nextAsked.filter((item) => item === 'extra').length;
  const scheduleStillOpen = gaps.includes('schedule') && !nextAsked.includes('schedule');
  let complete = false;
  if (gaps.length === 0 && (model.suggestComplete || visitorDone || extras >= 2)) complete = true;
  else if (visitorDone && !scheduleStillOpen) complete = true;
  else if (gaps.length === 0) remember('extra');

  const pending = complete ? null : (gaps[0] ?? 'review');
  return {
    record: next,
    asked: nextAsked,
    pending,
    complete,
    assistantMessage: publicReply(model.assistantMessage, gaps[0] ?? null, complete),
  };
}

export function classifyFailure(error: unknown): { status: number; error: 'rate_limited' | 'unavailable'; message: string } {
  const status = typeof error === 'object' && error && 'status' in error ? Number((error as { status?: number }).status) : 0;
  if (status === 429) {
    return {
      status: 429,
      error: 'rate_limited',
      message: 'The assessment is busy at the moment. Wait a little, then try again. Your reply is saved.',
    };
  }
  return {
    status: 503,
    error: 'unavailable',
    message: "I couldn't continue just now. Your reply is still here, so you can try again.",
  };
}

export function summariseRecord(record: AssessmentRecord): string {
  const time = record.workload.activeTime.value;
  const lines = [
    factLine('Sector', record.business.sector),
    factLine('Size', record.business.size),
    factLine('Nature', record.business.nature),
    factLine('Challenge', record.business.challenges),
    record.executive.responsibilities.value?.length ? `Executive: ${record.executive.responsibilities.value.join(', ')}` : '',
    record.project.notes.value?.length ? `Project: ${record.project.notes.value.join(', ')}` : '',
    record.operations.notes.value?.length ? `Operations: ${record.operations.notes.value.join(', ')}` : '',
    time
      ? `Active time: ${time.stated}${time.needsClarification ? ' (days unknown, do not convert to a week)' : time.weeklyHours != null && time.unit === 'day' ? `; calculated week ${time.weeklyHours}` : ''}`
      : record.workload.uncertainty.value
        ? 'Active time: unknown'
        : '',
    factLine('Availability', record.availability.window),
    factLine('Working days', record.availability.workingDays),
    factLine('Staffing', record.staffing.model),
    factLine('Location', record.staffing.location),
    record.process.manualWork.value ? 'Process: manual or duplicated work mentioned' : '',
    record.process.automation.value ? 'Process: automation mentioned' : '',
  ];
  const filled = lines.filter(Boolean);
  return filled.length ? filled.join('\n') : 'Nothing confirmed yet.';
}

function applyBusiness(record: AssessmentRecord, text: string, model: ModelTurn): void {
  const sector = sectorFromText(text) ?? (mentioned(text, model.business.sector) ? clean(model.business.sector, 80) : null);
  record.business.sector = replaceText(record.business.sector, sector, 'explicit', model.business.correction || Boolean(sectorFromText(text)), text);
  const size = sizeFromText(text);
  record.business.size = replaceText(record.business.size, size, 'explicit', model.business.correction || Boolean(size), text);
  record.business.nature = replaceText(
    record.business.nature,
    mentioned(text, model.business.nature) ? clean(model.business.nature, 160) : null,
    'explicit',
    model.business.correction,
    text,
  );
  record.business.challenges = replaceText(
    record.business.challenges,
    mentioned(text, model.business.challenges) ? clean(model.business.challenges, 200) : null,
    'explicit',
    model.business.correction,
    text,
  );
}

function applyLabels(record: AssessmentRecord, text: string, model: ModelTurn): void {
  const executive = unique([...labelsInText(text, EXECUTIVE), ...modelLabels(model.executive.responsibilities, EXECUTIVE, text)]);
  if (executive.length) {
    record.executive.mentioned = true;
    record.executive.responsibilities = mergeList(record.executive.responsibilities, executive, model.executive.correction, text);
  }
  const project = unique([...labelsInText(text, PROJECT), ...modelLabels(model.project.notes, PROJECT, text)]);
  if (project.length) {
    record.project.mentioned = true;
    record.project.notes = mergeList(record.project.notes, project, model.project.correction, text);
  }
  const count = text.match(/\b(\d{1,3})\s+(?:active\s+)?projects?\b/i);
  if (count) record.project.activeProjects = explicitFact(`${count[1]} projects`, text, Boolean(record.project.activeProjects.value));
  const operations = unique([...labelsInText(text, OPERATIONS), ...modelLabels(model.operations.notes, OPERATIONS, text)]);
  if (operations.length) {
    record.operations.mentioned = true;
    record.operations.notes = mergeList(record.operations.notes, operations, model.operations.correction, text);
  }
}

function applyWorkingTime(record: AssessmentRecord, text: string, model: ModelTurn, gap: EssentialGap | null): void {
  const parsed = readWorkingTime(text, 'workload', record.workload.activeTime.value, gap === 'schedule' ? 'schedule' : 'workload');
  if (parsed && workingTimeChanged(record.workload.activeTime.value, parsed)) {
    const revised = record.workload.activeTime.value != null && !sameWorkingTime(record.workload.activeTime.value, parsed);
    record.workload.activeTime = parsed.unitStated ? explicitFact(parsed, text, revised) : inferredFact(parsed, text, revised);
    record.workload.uncertainty = unknownFact();
  } else if (!parsed) {
    const proposal = model.workingTime;
    const current = record.workload.activeTime.value;
    const canReplace = !current || record.workload.activeTime.source !== 'explicit' || proposal.correction || statedUnitCorrection(text) != null;
    const saysDay = /\b(?:a|per|each|\/)\s*day\b|\bdaily\b/i.test(text);
    const saysWeek = /\b(?:a|per|each|\/)\s*week\b|\bweekly\b/i.test(text);
    const unitAgrees = !(proposal.unit === 'week' && saysDay && !statedUnitCorrection(text)) && !(proposal.unit === 'day' && saysWeek && !saysDay);
    const days = proposal.unit === 'day' && proposal.daysPerWeek != null && textHasAmount(text, proposal.daysPerWeek) ? proposal.daysPerWeek : null;
    if (
      canReplace &&
      unitAgrees &&
      proposal.amount != null &&
      (proposal.unit === 'day' || proposal.unit === 'week') &&
      textHasAmount(text, proposal.amount) &&
      (proposal.amountTo == null || textHasAmount(text, proposal.amountTo))
    ) {
      const built = workingTimeFromParts({
        amount: proposal.amount,
        amountTo: proposal.amountTo,
        unit: proposal.unit,
        daysPerWeek: days,
      });
      record.workload.activeTime = explicitFact(built, text, current != null);
      record.workload.uncertainty = unknownFact();
    } else if (proposal.unknown && !current && (gap === 'workload' || isUnsure(text))) {
      record.workload.uncertainty = explicitFact('You said a working-time figure is not known yet.', text);
    }
  }

  if (model.workingTime.pattern && /\b(each week|every week|weekly|occasional|ad hoc|regular)\b/i.test(text)) {
    record.workload.pattern = replaceText(record.workload.pattern, clean(model.workingTime.pattern, 80), 'explicit', model.workingTime.correction, text);
  }
  if (model.workingTime.peak && /\b(peak|busier|quarter[- ]end|month[- ]end|year[- ]end)\b/i.test(text)) {
    record.workload.peak = replaceText(record.workload.peak, 'You described busier periods as well as the normal week.', 'explicit', false, text);
  }
}

function applyAvailability(record: AssessmentRecord, text: string, model: ModelTurn, gap: EssentialGap | null): void {
  const found = explicitAvailability(text);
  if (gap !== 'schedule' && found.days) {
    record.availability.workingDays = replaceText(record.availability.workingDays, found.days, 'explicit', model.availability.correction, text);
  }
  if (found.window) {
    record.availability.window = replaceText(record.availability.window, found.window, 'explicit', model.availability.correction, text);
  } else if (model.availability.window && numbersAreInText(text, model.availability.window)) {
    record.availability.window = replaceText(
      record.availability.window,
      clean(model.availability.window, 80),
      'explicit',
      model.availability.correction,
      text,
    );
  }
  if (model.availability.timeSensitive && /\b(urgent|same day|time[- ]sensitive|as soon as)\b/i.test(text)) {
    record.availability.timeSensitive = explicitFact('Some work is time-sensitive.', text);
  }
  if (model.availability.dedicatedCover && /\b(dedicated|solely|only for us|just for us)\b/i.test(text)) {
    record.availability.dedicatedCover = explicitFact('You mentioned dedicated cover.', text);
  }
  if (model.availability.holidayCover && /\b(holiday|annual leave|when (?:i am|i'm|we are|we're) (?:away|off|on leave))\b/i.test(text)) {
    record.availability.holidayCover = explicitFact('You mentioned cover during absence.', text);
  }
}

function applyStaffing(record: AssessmentRecord, text: string, model: ModelTurn): void {
  const modelFromText = staffingFromText(text);
  const modelChoice = modelFromText ?? (supportedStaffing(text, model.staffing.model) ? model.staffing.model : null);
  if (modelChoice) {
    const canReplace = !record.staffing.model.value || record.staffing.model.source !== 'explicit' || model.staffing.correction || modelFromText != null;
    if (canReplace) {
      record.staffing.model = explicitFact(modelChoice, text, Boolean(record.staffing.model.value && record.staffing.model.value !== modelChoice));
    }
  }
  const locationFromWords = locationFromText(text);
  const location = locationFromWords ?? (supportedLocation(text, model.staffing.location) ? model.staffing.location : null);
  if (location) {
    const canReplace = !record.staffing.location.value || record.staffing.location.source !== 'explicit' || model.staffing.correction || locationFromWords != null;
    if (canReplace) {
      record.staffing.location = explicitFact(location, text, Boolean(record.staffing.location.value && record.staffing.location.value !== location));
    }
  }
  const budget = text.match(/£\s?\d[\d,]*(?:\s?(?:k|per hour|an hour|\/hour))?/i);
  if (budget) record.staffing.budget = explicitFact(budget[0].replace(/\s+/g, ' '), text, Boolean(record.staffing.budget.value));
  if (model.staffing.continuity && mentioned(text, model.staffing.continuity)) {
    record.staffing.continuity = replaceText(record.staffing.continuity, clean(model.staffing.continuity, 120), 'explicit', model.staffing.correction, text);
  }
  if (model.staffing.existingSupport && mentioned(text, model.staffing.existingSupport)) {
    record.staffing.existingSupport = replaceText(record.staffing.existingSupport, clean(model.staffing.existingSupport, 120), 'explicit', model.staffing.correction, text);
  }
}

function applyProcess(record: AssessmentRecord, text: string, model: ModelTurn): void {
  if (/\b(manual\w*|duplicat\w*|copying information|spreadsheets?)\b/i.test(text) || (model.process.manualWork && /manual|spreadsheet|duplicat|copying/i.test(text))) {
    record.process.manualWork = explicitFact('You described manual or duplicated work.', text, Boolean(record.process.manualWork.value));
  }
  if (/\bautomat\w*\b/i.test(text)) {
    record.process.automation = explicitFact('You mentioned automation.', text, Boolean(record.process.automation.value));
  }
  const systems = [...labelsInText(text, SYSTEMS), ...modelLabels(model.process.systems, SYSTEMS, text)];
  if (systems.length) record.process.systems = mergeList(record.process.systems, unique(systems), false, text);
  if (model.process.skipped && isDecline(text)) record.process.skipped = true;
}

function publicReply(message: string, gap: EssentialGap | null, complete: boolean): string {
  let text = message.replace(/\s+/g, ' ').trim().slice(0, 1200);
  if (!text || BLOCKED_REPLY.test(text)) text = complete ? SAFE_CLOSE : GAP_QUESTION[gap ?? 'business'];
  if (complete) {
    if (!/later phase/i.test(text)) text = `${text} ${SAFE_CLOSE}`.trim();
    return text;
  }
  if (gap && !text.includes('?')) text = `${text} ${GAP_QUESTION[gap]}`.trim();
  return text;
}

function replaceText<T extends string>(current: Fact<T>, value: string | null, source: FactSource, correction: boolean, evidence: string): Fact<T> {
  if (!value) return current;
  if (current.value && current.source === 'explicit' && !correction && current.value !== value) return current;
  if (current.value === value) return current;
  const revised = current.value != null;
  return source === 'inferred' ? inferredFact(value as T, evidence, revised) : explicitFact(value as T, evidence, revised);
}

function mergeList(current: Fact<string[]>, labels: string[], correction: boolean, evidence: string): Fact<string[]> {
  if (current.value?.length && current.source === 'explicit' && correction) return explicitFact(labels, evidence, true);
  const merged = unique([...(current.value ?? []), ...labels]);
  return explicitFact(merged, evidence, Boolean(current.value?.length));
}

interface Signal {
  label: string;
  pattern: RegExp;
}

const EXECUTIVE: Signal[] = [
  { label: 'Diary management', pattern: /\bdiar(?:y|ies)\b/i },
  { label: 'Calendar management', pattern: /\bcalendar\b/i },
  { label: 'Inbox management', pattern: /\binbox\b|\bemails?\b/i },
  { label: 'Meeting minutes', pattern: /\bminutes?\b/i },
  { label: 'Travel coordination', pattern: /\btravel\b/i },
  { label: 'Scheduling', pattern: /\bschedul\w*\b|\brearrang\w*\s+meetings?\b/i },
];

const PROJECT: Signal[] = [
  { label: 'Project support', pattern: /\bprojects?\b/i },
  { label: 'Milestone tracking', pattern: /\bmilestones?\b/i },
  { label: 'Action tracking', pattern: /\bactions?\b/i },
  { label: 'Stakeholder coordination', pattern: /\bstakeholders?\b/i },
  { label: 'Chasing and follow-up', pattern: /\bchas(?:e|ing)\b/i },
];

const OPERATIONS: Signal[] = [
  { label: 'Client onboarding', pattern: /\bonboarding\b/i },
  { label: 'Supplier coordination', pattern: /\bsuppliers?\b/i },
  { label: 'Invoicing and payment follow-up', pattern: /\binvoic(?:e|es|ing)\b|\bpayment follow[- ]?ups?\b/i },
  { label: 'Recruitment administration', pattern: /\brecruitment admin\b/i },
  { label: 'CRM administration', pattern: /\bcrm\b/i },
];

const SYSTEMS: Signal[] = [
  { label: 'Accounting software', pattern: /\b(xero|quickbooks|freeagent)\b/i },
  { label: 'CRM', pattern: /\b(salesforce|hubspot)\b/i },
  { label: 'Project tool', pattern: /\b(asana|monday\.com|trello|jira)\b/i },
  { label: 'Email and calendar system', pattern: /\b(outlook|gmail|google workspace|microsoft 365)\b/i },
];

const SECTORS: Signal[] = [
  { label: 'Legal', pattern: /\b(solicitor|law firm|barrister|legal)\b/i },
  { label: 'Accountancy', pattern: /\baccountan\w*\b/i },
  { label: 'Consulting', pattern: /\bconsultan\w*\b/i },
  { label: 'Property and construction', pattern: /\b(architect\w*|surveyor\w*)\b/i },
  { label: 'Financial services', pattern: /\b(financial advis\w*|wealth)\b/i },
  { label: 'Charity', pattern: /\b(charity|non[- ]profit)\b/i },
];

function labelsInText(text: string, signals: Signal[]): string[] {
  return signals.filter((signal) => signal.pattern.test(text)).map((signal) => signal.label);
}

function allowed(values: string[], signals: Signal[]): string[] {
  const names = new Set(signals.map((signal) => signal.label.toLowerCase()));
  return values.filter((value) => names.has(value.trim().toLowerCase())).map((value) => {
    const found = signals.find((signal) => signal.label.toLowerCase() === value.trim().toLowerCase());
    return found?.label ?? value.trim();
  });
}

function modelLabels(values: string[], signals: Signal[], text: string): string[] {
  if (/^(how|what|when|why|where|can you|could you)\b/i.test(text) && text.length < 180) return [];
  return allowed(values, signals);
}

function sectorFromText(text: string): string | null {
  return SECTORS.find((sector) => sector.pattern.test(text))?.label ?? null;
}

function sizeFromText(text: string): string | null {
  const people = text.match(/\b(\d{1,4})\s*(?:people|persons?|staff|employees|fee[- ]earners)\b/i);
  return people ? `${people[1]} people` : null;
}

function staffingFromText(text: string): StaffingModel | null {
  const outsourced = /\b(outsourc\w*|virtual assistant|external support)\b/i.test(text);
  const permanent = /\b(permanent|on the payroll|employee|employing|hire someone|hiring)\b/i.test(text);
  if (outsourced && permanent && !/\bvirtual assistant\b/i.test(text)) return 'comparing';
  if (outsourced) return 'outsourced';
  if (permanent) return 'permanent';
  return null;
}

function supportedStaffing(text: string, model: StaffingModel | null): boolean {
  if (model === 'outsourced') return /\b(outsourc|virtual assistant|contractor)\b/i.test(text);
  if (model === 'permanent') return /\b(permanent|payroll|employ|hire someone|hiring|in-house|in house)\b/i.test(text);
  if (model === 'comparing' || model === 'unsure') {
    return /\b(not sure|either|both|compar|undecided)\b/i.test(text) && /\b(outsourc|hir|employ|permanent|in-house|in house)\b/i.test(text);
  }
  return false;
}

function locationFromText(text: string): WorkLocation | null {
  const remote = /\b(remote(?:ly)?|from home|work from home)\b/i.test(text);
  const onSite = /\b(on[- ]?site|in the office|in our office|on the premises)\b/i.test(text);
  if (/\bhybrid\b/i.test(text) || (remote && onSite)) return 'hybrid';
  if (remote) return 'remote';
  if (onSite) return 'on-site';
  return null;
}

function supportedLocation(text: string, model: WorkLocation | null): boolean {
  return model != null && locationFromText(text) === model;
}

function explicitAvailability(text: string): { window: string | null; days: string | null } {
  let window: string | null = null;
  const clock = text.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|–|to)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i);
  if (clock && /\b(available|availability|reachable|cover|office hours)\b/i.test(text)) {
    window = `${clock[1].replace(/\s+/g, '')}–${clock[2].replace(/\s+/g, '')}`;
  }
  const covered = text.match(/\b(?:available|availability|reachable|cover)(?:\s+\w+){0,5}\s+(\d{1,3})\s*hours?\b/i);
  if (!window && covered) window = `${covered[1]} hours of availability`;
  let days: string | null = null;
  if (/\b(available|availability|reachable|cover|office)\b/i.test(text) && /\bmonday\s*(?:to|–|-)\s*friday\b|\bweekdays\b/i.test(text)) {
    days = 'Monday to Friday';
  }
  return { window, days };
}

function factLine(label: string, fact: Fact<string | null> | Fact<string>): string {
  return fact.value ? `${label}: ${fact.value}` : '';
}

function mentioned(text: string, value: string | null): boolean {
  if (!value) return false;
  const words = value.toLowerCase().split(/\W+/).filter((word) => word.length > 3);
  if (!words.length) return false;
  const haystack = text.toLowerCase();
  return words.filter((word) => haystack.includes(word)).length >= Math.min(2, words.length);
}

function numbersAreInText(text: string, value: string): boolean {
  const numbers = value.match(/\d+/g) ?? [];
  return numbers.every((number) => textHasAmount(text, Number(number)));
}

function textHasAmount(text: string, amount: number): boolean {
  return new RegExp(`\\b${amount}\\b`).test(text);
}

function clean(value: string | null, max: number): string | null {
  if (!value) return null;
  const text = value.replace(/\s+/g, ' ').trim();
  if (!text || text.length > max) return null;
  return text;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function topicForGap(gap: EssentialGap | null): TopicId {
  if (gap === 'schedule' || gap === 'workload') return 'workload';
  if (gap === 'support') return 'support';
  if (!gap) return 'review';
  return gap;
}

function isUnsure(text: string): boolean {
  return /\b(not sure|don'?t know|do not know|no idea|hard to say)\b/i.test(text);
}

function isDecline(text: string): boolean {
  return /^(no|nope|nothing|skip|not sure|n\/a|na)\.?$/i.test(text.trim());
}

function isDone(text: string): boolean {
  return /^(no|nope|nothing|nothing else|that'?s all|that is all|that'?s everything|i'?m done|all good)\.?$/i.test(text.trim());
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.replace(/\s+/g, ' ').trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function textList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function whole(value: unknown, max: number): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > max) return null;
  return value;
}

function isStaffingModel(value: unknown): value is StaffingModel {
  return value === 'outsourced' || value === 'permanent' || value === 'comparing' || value === 'unsure';
}

function isLocation(value: unknown): value is WorkLocation {
  return value === 'remote' || value === 'hybrid' || value === 'on-site';
}

function isRecord(value: unknown): value is AssessmentRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as AssessmentRecord;
  return Boolean(record.business && record.workload && record.availability && record.staffing && Array.isArray(record.statements));
}

function cloneRecord(record: AssessmentRecord): AssessmentRecord {
  return JSON.parse(JSON.stringify(record)) as AssessmentRecord;
}
