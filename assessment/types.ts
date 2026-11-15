export type FactSource = 'explicit' | 'inferred' | 'provisional' | 'unknown';
export type Confidence = 'high' | 'medium' | 'low' | 'none';
export type WorkingTimeUnit = 'day' | 'week';

/**
 * Active working time, kept in the unit the visitor used.
 * A weekly total is stored only when they stated a week, or stated a day and the number of days.
 */
export interface ActiveWorkingTime {
  stated: string;
  amount: number;
  amountTo: number | null;
  unit: WorkingTimeUnit;
  /** False when a bare number was taken as weekly because the question asked about a normal week. */
  unitStated: boolean;
  daysPerWeek: number | null;
  weeklyHours: number | null;
  weeklyHoursTo: number | null;
  needsClarification: boolean;
}

/** A single captured value. Unknown stays null and is never filled with a guess. */
export interface Fact<T> {
  value: T | null;
  source: FactSource;
  confidence: Confidence;
  evidence?: string;
  revised?: boolean;
}

export type TopicId =
  | 'business'
  | 'support'
  | 'executive'
  | 'project'
  | 'operations'
  | 'workload'
  | 'availability'
  | 'staffing'
  | 'process'
  | 'review';

/** Confirmed and not applicable are closed. Unknown is not automatically a question. */
export type TopicStatus = 'confirmed' | 'unknown' | 'clarification' | 'not_applicable';

export interface ProvisionalAssumption {
  id: string;
  text: string;
  topic: TopicId;
}

/** Something the visitor described about the work. It is evidence, not a calculated hour figure. */
export interface WorkloadEvidenceNote {
  id: string;
  text: string;
}

export type ProgressStage = 'business' | 'workload' | 'availability' | 'preferences' | 'review';

export type StaffingModel = 'outsourced' | 'permanent' | 'comparing' | 'unsure';
export type WorkLocation = 'remote' | 'hybrid' | 'on-site';

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'visitor';
  text: string;
}

export interface Statement {
  id: string;
  topic: TopicId;
  text: string;
  source: 'explicit';
  confidence: 'high';
}

export interface AssessmentRecord {
  business: {
    sector: Fact<string>;
    nature: Fact<string>;
    size: Fact<string>;
    model: Fact<string>;
    challenges: Fact<string>;
  };
  executive: {
    mentioned: boolean;
    /** The role the visitor asked for. It is not confirmation that this is the right role. */
    requestedRole: Fact<string>;
    responsibilities: Fact<string[]>;
  };
  project: {
    mentioned: boolean;
    status: TopicStatus;
    notes: Fact<string[]>;
    activeProjects: Fact<string>;
  };
  operations: {
    mentioned: boolean;
    notes: Fact<string[]>;
  };
  workload: {
    /** The visitor's own hour estimate, kept in the unit they used. Not a validated workload. */
    activeTime: Fact<ActiveWorkingTime>;
    /** Same estimate, held separately so a later assessment cannot be mistaken for what they asked for. */
    requestedTime: Fact<ActiveWorkingTime>;
    evidence: WorkloadEvidenceNote[];
    /** Left unset until a later phase compares the estimate with the evidence. */
    assessed: Fact<string>;
    /** Set only when the visitor agrees a figure. Not calculated here. */
    agreed: Fact<ActiveWorkingTime>;
    pattern: Fact<string>;
    peak: Fact<string>;
    uncertainty: Fact<string>;
  };
  availability: {
    window: Fact<string>;
    workingDays: Fact<string>;
    timeSensitive: Fact<string>;
    dedicatedCover: Fact<string>;
    flexibility: Fact<string>;
    holidayCover: Fact<string>;
  };
  staffing: {
    model: Fact<StaffingModel>;
    location: Fact<WorkLocation>;
    continuity: Fact<string>;
    budget: Fact<string>;
    manageEmployee: Fact<string>;
    startDate: Fact<string>;
    existingSupport: Fact<string>;
    constraints: Fact<string>;
  };
  process: {
    skipped: boolean;
    systems: Fact<string[]>;
    manualWork: Fact<string>;
    automation: Fact<string>;
  };
  statements: Statement[];
  /** Reasonable readings that must not be shown as confirmed facts. */
  assumptions: ProvisionalAssumption[];
}

export interface AssessmentSession {
  version: 2;
  openingNote: string;
  messages: ChatMessage[];
  record: AssessmentRecord;
  asked: string[];
  pending: string | null;
  complete: boolean;
}

export interface ReviewItem {
  label: string;
  detail: string;
  kind: 'confirmed' | 'derived' | 'provisional' | 'words' | 'unknown' | 'skipped';
}

export interface ReviewSection {
  title: string;
  items: ReviewItem[];
}

export function unknownFact<T>(): Fact<T> {
  return { value: null, source: 'unknown', confidence: 'none' };
}

export function explicitFact<T>(value: T, evidence: string, revised = false): Fact<T> {
  return { value, source: 'explicit', confidence: 'high', evidence, revised };
}

export function inferredFact<T>(value: T, evidence: string, revised = false): Fact<T> {
  return { value, source: 'inferred', confidence: 'medium', evidence, revised };
}

export function createEmptyRecord(): AssessmentRecord {
  return {
    business: {
      sector: unknownFact(),
      nature: unknownFact(),
      size: unknownFact(),
      model: unknownFact(),
      challenges: unknownFact(),
    },
    executive: { mentioned: false, requestedRole: unknownFact(), responsibilities: unknownFact() },
    project: { mentioned: false, status: 'unknown', notes: unknownFact(), activeProjects: unknownFact() },
    operations: { mentioned: false, notes: unknownFact() },
    workload: {
      activeTime: unknownFact(),
      requestedTime: unknownFact(),
      evidence: [],
      assessed: unknownFact(),
      agreed: unknownFact(),
      pattern: unknownFact(),
      peak: unknownFact(),
      uncertainty: unknownFact(),
    },
    availability: {
      window: unknownFact(),
      workingDays: unknownFact(),
      timeSensitive: unknownFact(),
      dedicatedCover: unknownFact(),
      flexibility: unknownFact(),
      holidayCover: unknownFact(),
    },
    staffing: {
      model: unknownFact(),
      location: unknownFact(),
      continuity: unknownFact(),
      budget: unknownFact(),
      manageEmployee: unknownFact(),
      startDate: unknownFact(),
      existingSupport: unknownFact(),
      constraints: unknownFact(),
    },
    process: {
      skipped: false,
      systems: unknownFact(),
      manualWork: unknownFact(),
      automation: unknownFact(),
    },
    statements: [],
    assumptions: [],
  };
}
