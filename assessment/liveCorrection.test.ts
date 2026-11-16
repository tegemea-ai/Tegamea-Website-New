import { describe, expect, it } from 'vitest';
import { applyModelTurn, blankModelTurn } from './applyTurn';
import { recommendRole } from './role/recommend';
import { createEmptyRecord, type AssessmentRecord } from './types';

function reply(record: AssessmentRecord, asked: string[], text: string, assistantMessage: string) {
  return applyModelTurn(record, text, blankModelTurn(assistantMessage), asked);
}

describe('live bookkeeping conversation', () => {
  it('keeps invoicing and diary management, and does not invent an operations pattern from part time', () => {
    let state = reply(
      createEmptyRecord(),
      [],
      'Director looking for an assistant for book keeping and diary management',
      'To assist effectively, could you specify which aspects of book keeping and diary management you would like taken off your plate?',
    );
    expect(state.record.executive.responsibilities.value).toEqual(expect.arrayContaining(['Diary management']));
    expect(state.record.operations.notes.value).toEqual(expect.arrayContaining(['Bookkeeping']));

    state = reply(state.record, state.asked, 'Invoices and scheduling', 'How many hours should we allow?');
    expect(state.record.operations.notes.value).toEqual(expect.arrayContaining(['Invoicing and payment follow-up']));
    expect(state.record.executive.responsibilities.value).toEqual(expect.arrayContaining(['Scheduling']));
    expect(state.assistantMessage).toMatch(/diary management/i);
    expect(state.assistantMessage).toMatch(/\*\*/);
    expect(state.assistantMessage).not.toMatch(/operational coordination/i);

    state = reply(state.record, state.asked, '10 meeting', 'You mentioned operational coordination. Is that a regular part of the week, or mainly at certain points in the year?');
    expect(state.record.workload.evidence.some((note) => /about 10 meetings in a typical week/i.test(note.text))).toBe(true);
    expect(state.record.workload.activeTime.value).toBeNull();
    expect(state.assistantMessage).toMatch(/invoices/i);
    expect(state.assistantMessage).not.toMatch(/operational coordination/i);

    state = reply(
      state.record,
      state.asked,
      'Part time',
      "You've noted that the operational coordination support is part time; could you share if this part-time involvement follows a consistent weekly pattern or varies throughout the year?",
    );
    expect(state.record.staffing.engagement.value).toBe('part-time');
    expect(state.record.staffing.engagement.source).toBe('provisional');
    expect(state.assistantMessage).toMatch(/assistant should work part time/i);
    expect(state.assistantMessage).not.toMatch(/throughout the year|operational coordination/i);
    expect(state.record.workload.assessment?.complete).toBe(false);
    expect(state.record.workload.assessed.value).toBeNull();
    expect(state.record.workload.agreed.value).toBeNull();
    expect(recommendRole(state.record)?.role).not.toBe('Blended arrangement');
    expect(state.assistantMessage).not.toMatch(/£/);
  });
});
