export type FactSource = 'explicit' | 'inferred' | 'provisional' | 'unknown';
export type Confidence = 'high' | 'medium' | 'low' | 'none';

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
    responsibilities: Fact<string[]>;
  };
  project: {
    mentioned: boolean;
    notes: Fact<string[]>;
    activeProjects: Fact<string>;
  };
  operations: {
    mentioned: boolean;
    notes: Fact<string[]>;
  };
  workload: {
    activeTime: Fact<string>;
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
}

export interface AssessmentSession {
  version: 1;
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
  kind: 'confirmed' | 'words' | 'unknown' | 'skipped';
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

export function createEmptyRecord(): AssessmentRecord {
  return {
    business: {
      sector: unknownFact(),
      nature: unknownFact(),
      size: unknownFact(),
      model: unknownFact(),
      challenges: unknownFact(),
    },
    executive: { mentioned: false, responsibilities: unknownFact() },
    project: { mentioned: false, notes: unknownFact(), activeProjects: unknownFact() },
    operations: { mentioned: false, notes: unknownFact() },
    workload: {
      activeTime: unknownFact(),
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
  };
}
