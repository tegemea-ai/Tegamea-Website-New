import { pictureFrom } from '../role/recommend';
import type { AssessmentRecord, WorkComponent, WorkloadAssessment } from '../types';
import { DOCUMENT_MINUTES, INBOX_BAND, type DocumentClass } from './benchmarks';

/**
 * Builds a workload reading from stored evidence and approved rules.
 * The model does not supply these figures. A weekly subtotal excludes provisional,
 * variable and unquantified work, and is never described as complete while any material
 * responsibility remains outside it.
 */
export function assessWorkload(record: AssessmentRecord): WorkloadAssessment | null {
  const evidence = (record.workload.evidence ?? []).map((note) => note.text).join(' ');
  const components = [
    inboxComponent(evidence, record),
    schedulingComponent(evidence, record),
    minutesComponent(evidence),
    documentComponent(evidence, record),
    booksComponent(record, evidence),
    coordinationComponent(record),
    operationsComponent(record),
    peakComponent(record),
  ].filter((component): component is WorkComponent => component != null);

  if (!components.length) return null;

  const weekly = components.filter((component) => component.status === 'benchmark' && component.period === 'week' && component.lowMinutes != null);
  const subtotalLowMinutes = weekly.length ? weekly.reduce((sum, component) => sum + (component.lowMinutes ?? 0), 0) : null;
  const subtotalHighMinutes = weekly.length ? weekly.reduce((sum, component) => sum + (component.highMinutes ?? 0), 0) : null;
  const materialOpen = components.some((component) => component.status === 'provisional' || component.status === 'unquantified' || component.status === 'variable');
  const notWeekly = components.some((component) => component.status === 'benchmark' && component.period !== 'week');
  const complete = weekly.length > 0 && !materialOpen && !notWeekly;
  const summary = describe(components, subtotalLowMinutes, subtotalHighMinutes, complete);
  return { complete, components, subtotalLowMinutes, subtotalHighMinutes, summary };
}

function inboxComponent(evidence: string, record: AssessmentRecord): WorkComponent | null {
  const named = (record.executive.responsibilities.value ?? []).includes('Inbox management');
  const count = evidence.match(/about (\d+) emails/i);
  if (!named && !count) return null;
  if (!count) {
    return component('inbox', 'Inbox management', 'unquantified', null, null, null, 'Inbox work was named. No message count was given, so the 60–90 minute anchor is not applied.');
  }
  const messages = Number(count[1]);
  if (messages < INBOX_BAND.minMessages || messages > INBOX_BAND.maxMessages) {
    return component('inbox', 'Inbox management', 'unquantified', null, null, null, `${messages} messages a day is outside the approved 80–150 band, so no inbox figure is applied. The number alone does not describe the work.`);
  }
  const heavier = /more than triage|needs? a reply|same-day reply/i.test(evidence);
  const triage = /triage|about 40%|40% actionable/i.test(evidence);
  if (!heavier && !triage) {
    return component(
      'inbox',
      'Inbox management',
      'unquantified',
      null,
      null,
      null,
      'The volume is inside 80–150 messages a day. The 60–90 minute anchor also needs about 40% actionable, which has not been described, so no inbox time is applied.',
    );
  }
  const days = record.workload.activeTime.value?.unit === 'day' ? record.workload.activeTime.value.daysPerWeek : null;
  if (heavier) {
    return component(
      'inbox',
      'Inbox management',
      'provisional',
      INBOX_BAND.lowMinutes,
      INBOX_BAND.highMinutes,
      'day',
      'The volume is inside 80–150, but more of it needs a reply than the anchor’s assumption of about 40% actionable. The 60–90 minute band is not treated as confirmed.',
    );
  }
  const note = '60–90 minutes a day from the approved inbox anchor. The actionable share was not described as heavier than about 40%.';
  if (days == null) {
    return component('inbox', 'Inbox management', 'benchmark', INBOX_BAND.lowMinutes, INBOX_BAND.highMinutes, 'day', `${note} The number of days was not given, so this stays a daily figure.`);
  }
  return component('inbox', 'Inbox management', 'benchmark', INBOX_BAND.lowMinutes * days, INBOX_BAND.highMinutes * days, 'week', `${note} Applied across the ${days} days they stated.`);
}

function schedulingComponent(evidence: string, record: AssessmentRecord): WorkComponent | null {
  const duties = record.executive.responsibilities.value ?? [];
  const named = duties.some((duty) => /diary|calendar|scheduling|client meeting/i.test(duty));
  const countMatch = evidence.match(/about (\d+) meetings/i);
  if (!named && !countMatch) return null;
  if (!countMatch) {
    return component('scheduling', 'Diary and meeting scheduling', 'unquantified', null, null, null, 'Diary management and client meetings are one area. No meeting count was given, so no scheduling figure is applied.');
  }
  const meetings = Number(countMatch[1]);
  if (pictureFrom(record).meetingNature === 'attend') {
    return component(
      'attendance',
      'Meeting attendance',
      'unquantified',
      null,
      null,
      null,
      `${meetings} meetings are attended. No approved attendance rate applies, and the scheduling anchors are not used.`,
    );
  }
  const external = /external/i.test(evidence);
  const internal = /internal/i.test(evidence);
  const simple = /straightforward|one-to-one|simple external/i.test(evidence);
  const complex = /several people|no calendar|complex/i.test(evidence);
  if (external && simple && !complex) {
    return component(
      'scheduling',
      'Diary and meeting scheduling',
      'benchmark',
      meetings * 5,
      meetings * 10,
      'week',
      `${meetings} straightforward external meetings, at the approved 5–10 minutes each. Diary management and client meetings are counted once.`,
    );
  }
  if (internal && !external && meetings === 12 && !complex) {
    return component('scheduling', 'Diary and meeting scheduling', 'benchmark', 15, 20, 'week', 'About 12 internal bookings in a simple batch: 15–20 minutes in total.');
  }
  if (!external && !internal) {
    return component('scheduling', 'Diary and meeting scheduling', 'unquantified', null, null, null, `About ${meetings} meetings were mentioned. Internal and external coordination use different approved figures, so neither is applied yet.`);
  }
  return component('scheduling', 'Diary and meeting scheduling', 'unquantified', null, null, null, 'The scheduling description does not match one approved scenario, so no figure is applied.');
}

function minutesComponent(evidence: string): WorkComponent | null {
  if (!/minutes described/i.test(evidence)) return null;
  if (/actions afterwards/i.test(evidence)) {
    return component('minutes', 'Meeting minutes', 'unquantified', null, null, null, 'Actions-only notes have no approved minute rate. The 1.5× drafting rule is not applied.');
  }
  const hours = evidence.match(/full note for a (\d+(?:\.\d+)?) hour/i);
  if (hours) {
    const duration = Number(hours[1]) * 60;
    const total = duration + duration * 1.5;
    return component('minutes', 'Meeting minutes', 'benchmark', total, total, 'week', 'Attendance plus 1.5× the meeting length for a full note drafted by hand. AI assistance is not subtracted.');
  }
  return component('minutes', 'Meeting minutes', 'unquantified', null, null, null, 'Minutes were mentioned without a meeting length, so the drafting rule is not applied.');
}

function documentComponent(evidence: string, record: AssessmentRecord): WorkComponent | null {
  const named = (record.executive.responsibilities.value ?? []).includes('Document preparation');
  const prepared = evidence.match(/about (\d+) (simple|standard|complex|substantial) documents/i);
  if (!named && !prepared) return null;
  if (!prepared) {
    return component('documents', 'Document preparation', 'unquantified', null, null, null, 'Document preparation was named. No class and count were given, so none of the 10–20, 20–45, 45–90 or 2–4 hour bands is applied.');
  }
  const count = Number(prepared[1]);
  const kind = prepared[2].toLowerCase() as DocumentClass;
  const [low, high] = DOCUMENT_MINUTES[kind];
  const week = /documents? a week/i.test(evidence) || /per week/i.test(evidence);
  return component(
    'documents',
    'Document preparation',
    'benchmark',
    count * low,
    count * high,
    week ? 'week' : null,
    `${count} ${kind} documents at ${low}–${high} minutes each, including normal revisions and approvals.${week ? '' : ' The timeframe was not stated, so this is not added into a weekly subtotal.'}`,
  );
}

function booksComponent(record: AssessmentRecord, evidence: string): WorkComponent | null {
  const notes = record.operations.notes.value ?? [];
  if (!notes.some((note) => /invoic|bookkeep/i.test(note))) return null;
  if (/invoice volume mentioned/i.test(evidence)) {
    return component('books', 'Invoicing and bookkeeping', 'unquantified', null, null, null, 'An invoice count was given. There is no approved minute rate for invoicing, so it is not converted into hours.');
  }
  return component('books', 'Invoicing and bookkeeping', 'unquantified', null, null, null, 'Invoicing or bookkeeping was named. There is no approved minute rate, so it stays outside any subtotal.');
}

function coordinationComponent(record: AssessmentRecord): WorkComponent | null {
  if ((record.project.status ?? 'unknown') === 'not_applicable') {
    return component('coordination', 'Project support', 'immaterial', null, null, null, 'Project support was described as not applicable.');
  }
  const notes = record.project.notes.value ?? [];
  if (!notes.some((note) => note !== 'None')) return null;
  return component('coordination', 'Project support and chasing', 'unquantified', null, null, null, 'Coordination was named. There is no blanket multiplier, so no hours are added.');
}

function operationsComponent(record: AssessmentRecord): WorkComponent | null {
  const notes = (record.operations.notes.value ?? []).filter((note) => !/invoic|bookkeep/i.test(note));
  if (!notes.length) return null;
  return component('operations', 'Operational coordination', 'unquantified', null, null, null, `${notes.join(', ')} was named. There is no approved rate for this operational work.`);
}

function peakComponent(record: AssessmentRecord): WorkComponent | null {
  if (!record.workload.peak.value) return null;
  return component('peak', 'Seasonal peak', 'variable', null, null, null, `${record.workload.peak.value} This is kept beside the normal week and is not added into the subtotal.`);
}

function component(
  id: string,
  label: string,
  status: WorkComponent['status'],
  lowMinutes: number | null,
  highMinutes: number | null,
  period: WorkComponent['period'],
  note: string,
): WorkComponent {
  return { id, label, status, lowMinutes, highMinutes, period, note };
}

function describe(components: WorkComponent[], low: number | null, high: number | null, complete: boolean): string {
  const outside = components.filter((item) => item.status !== 'benchmark' && item.status !== 'immaterial').map((item) => item.label);
  const anchored = components.filter((item) => item.status === 'benchmark' && item.period === 'week').map((item) => item.label);
  if (complete && low != null && high != null) {
    return `Assessed workload: ${formatSpan(low, high)} a week, from ${anchored.join(', ')}.`;
  }
  const parts: string[] = [];
  if (low != null && high != null) parts.push(`Quantified subtotal: ${formatSpan(low, high)} a week from ${anchored.join(', ')}. This is not a complete assessed workload.`);
  else parts.push('No complete weekly workload is available. This is not a complete assessed workload.');
  if (outside.length) parts.push(`Still outside any complete total: ${unique(outside).join(', ')}.`);
  return parts.join(' ');
}

function formatSpan(lowMinutes: number, highMinutes: number): string {
  return `${formatMinutes(lowMinutes)}–${formatMinutes(highMinutes)}`;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} minutes`;
  const hours = Math.round((minutes / 60) * 2) / 2;
  return Number.isInteger(hours) ? `${hours} ${hours === 1 ? 'hour' : 'hours'}` : `${hours} hours`;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
