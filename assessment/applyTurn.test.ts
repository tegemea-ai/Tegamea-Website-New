import { describe, expect, it } from 'vitest';
import { applyModelTurn, blankModelTurn, classifyFailure, coerceModelTurn, parseTurnRequest } from './applyTurn';
import { createEmptyRecord, explicitFact } from './types';
import { workingTimeFromParts } from './workingTime';

function turn(text: string, model = blankModelTurn('Noted.')) {
  return applyModelTurn(createEmptyRecord(), text, model, []);
}

describe('assessment turn rules', () => {
  it('keeps 2 hours per day as daily and asks for the days', () => {
    const applied = turn('The diary work takes 2 hours per day.');
    const time = applied.record.workload.activeTime.value;
    expect(time?.unit).toBe('day');
    expect(time?.amount).toBe(2);
    expect(time?.daysPerWeek).toBeNull();
    expect(time?.weeklyHours).toBeNull();
    expect(time?.needsClarification).toBe(true);
    expect(applied.complete).toBe(false);
    expect(applied.assistantMessage).toMatch(/days a week/i);
    expect(applied.assistantMessage).not.toMatch(/2 hours per week/i);
  });

  it('corrects 2 hours per week to 2 hours per day without inventing the days', () => {
    const first = turn('The diary work takes 2 hours per week.');
    expect(first.record.workload.activeTime.value?.weeklyHours).toBe(2);
    const corrected = applyModelTurn(
      first.record,
      'I said 2 hours per day, not per week.',
      blankModelTurn('Thanks, I have changed that.'),
      first.asked,
    );
    const time = corrected.record.workload.activeTime.value;
    expect(time?.unit).toBe('day');
    expect(time?.amount).toBe(2);
    expect(time?.weeklyHours).toBeNull();
    expect(time?.needsClarification).toBe(true);
    expect(corrected.assistantMessage).toMatch(/won't assume a five-day week/i);
    expect(corrected.assistantMessage).not.toMatch(/10 hours/);
  });

  it('keeps 10 hours of work separate from 40 hours of availability', () => {
    const applied = turn('I need 10 hours of work, but someone available for 40 hours a week.');
    expect(applied.record.workload.activeTime.value?.amount).toBe(10);
    expect(applied.record.workload.activeTime.value?.weeklyHours).not.toBe(40);
    expect(applied.record.availability.window.value).toMatch(/40 hours of availability/);
  });

  it('records several facts from one reply', () => {
    const applied = turn(
      'We are a 12 person law firm. The diary and inbox are taking over, and we chase project actions. We want outsourced support, working remotely. Much of it is copying information between spreadsheets.',
    );
    expect(applied.record.business.sector.value).toBe('Legal');
    expect(applied.record.business.size.value).toBe('12 people');
    expect(applied.record.executive.responsibilities.value).toEqual(expect.arrayContaining(['Diary management', 'Inbox management']));
    expect(applied.record.project.notes.value).toEqual(expect.arrayContaining(['Chasing and follow-up']));
    expect(applied.record.staffing.model.value).toBe('outsourced');
    expect(applied.record.staffing.location.value).toBe('remote');
    expect(applied.record.process.manualWork.value).toMatch(/manual or duplicated/i);
  });

  it('does not let the model overwrite a confirmed fact without a correction', () => {
    const record = createEmptyRecord();
    record.business.sector = explicitFact('Legal', 'We are a law firm.');
    record.workload.activeTime = explicitFact(workingTimeFromParts({ amount: 10, unit: 'week' }), '10 hours a week');
    const model = blankModelTurn('Shall we talk about the office?');
    model.business.sector = 'Accountancy';
    model.workingTime.amount = 40;
    model.workingTime.unit = 'week';
    const applied = applyModelTurn(record, 'The office is in London.', model, ['business', 'support', 'workload']);
    expect(applied.record.business.sector.value).toBe('Legal');
    expect(applied.record.workload.activeTime.value?.weeklyHours).toBe(10);
  });

  it('drops a reply that tries to recommend a price', () => {
    const model = blankModelTurn('I recommend a retainer at £30 per hour.');
    const applied = turn('We are a consultancy and the inbox is the problem.', model);
    expect(applied.assistantMessage).not.toMatch(/£|per hour|I recommend/i);
  });

  it('closes once the essential picture is known', () => {
    let record = createEmptyRecord();
    let asked: string[] = [];
    const steps = [
      'We are a 12 person consultancy and the diary is taking over.',
      'The work takes 2 hours per day, 5 days per week.',
      'Someone needs to be available from 9am to 5pm.',
      'We want outsourced support.',
    ];
    for (const text of steps) {
      const applied = applyModelTurn(record, text, blankModelTurn('What else should I know?'), asked);
      record = applied.record;
      asked = applied.asked;
      expect(applied.complete).toBe(false);
    }
    const closing = blankModelTurn('I have a clear picture.');
    closing.suggestComplete = true;
    const closed = applyModelTurn(record, 'I think that covers it.', closing, asked);
    expect(closed.complete).toBe(true);
    expect(closed.assistantMessage).toMatch(/later phase/i);
    expect(closed.assistantMessage).not.toMatch(/£/);
    expect(closed.record.workload.activeTime.value?.weeklyHours).toBe(10);
  });

  it('rejects an oversized reply and classifies a rate limit', () => {
    const parsed = parseTurnRequest({
      messages: [{ role: 'visitor', text: 'a'.repeat(2001) }],
      record: createEmptyRecord(),
      asked: [],
    });
    expect(parsed.ok).toBe(false);
    expect(classifyFailure({ status: 429 }).error).toBe('rate_limited');
    expect(classifyFailure(new Error('network')).error).toBe('unavailable');
  });

  it('ignores a model weekly total that the visitor did not state', () => {
    const model = blankModelTurn('How many days a week is that?');
    model.workingTime = { ...model.workingTime, amount: 10, unit: 'week', daysPerWeek: 5 };
    const applied = turn('The diary takes most of the morning.', model);
    expect(applied.record.workload.activeTime.value).toBeNull();
  });
});

describe('model output', () => {
  it('rejects an empty model reply before it can change the record', () => {
    expect(() => coerceModelTurn({ assistantMessage: '  ' })).toThrow(/empty model output/);
  });
});
