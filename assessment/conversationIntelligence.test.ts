/**
 * Deterministic checks for memory, repetition and proportionate questioning.
 * The OpenAI model is mocked. These tests do not prove that a live model will always sound natural.
 */
import { describe, expect, it, vi } from 'vitest';
import { applyModelTurn, blankModelTurn, summariseRecord } from './applyTurn';
import { buildAssessmentInput } from './instructions';
import { clearSession, loadSession, saveSession } from './storage';
import { createEmptyRecord, explicitFact, type AssessmentRecord } from './types';
import { workingTimeFromParts } from './workingTime';

function reply(record: AssessmentRecord, asked: string[], text: string, assistantMessage: string, suggestComplete = false) {
  const model = blankModelTurn(assistantMessage);
  model.suggestComplete = suggestComplete;
  return applyModelTurn(record, text, model, asked);
}

describe('conversation memory', () => {
  it('extracts daily hours, the day unit and remote work from the opening statement', () => {
    const applied = reply(
      createEmptyRecord(),
      [],
      'I need two hours of remote support per day.',
      'Roughly how much active working time does this take, and is that per day or per week?',
    );
    const time = applied.record.workload.activeTime.value;
    expect(time?.amount).toBe(2);
    expect(time?.unit).toBe('day');
    expect(time?.unitStated).toBe(true);
    expect(time?.daysPerWeek).toBeNull();
    expect(time?.weeklyHours).toBeNull();
    expect(time?.needsClarification).toBe(true);
    expect(applied.record.staffing.location.value).toBe('remote');
    expect(applied.record.workload.assessed.value).toBeNull();
    expect(applied.assistantMessage).toMatch(/which parts of the work/i);
    expect(applied.assistantMessage).not.toMatch(/how many hours|how many days|how much active working time/i);
    expect(applied.assistantMessage).not.toMatch(/2 hours per week/i);
  });

  it('still knows the daily hours after many later exchanges', () => {
    let state = reply(createEmptyRecord(), [], 'I need two hours of remote support per day.', 'Noted.');
    for (let turn = 0; turn < 11; turn += 1) {
      state = reply(
        state.record,
        state.asked,
        `Nothing new to add on point ${turn}.`,
        'Roughly how much active working time does this take, and is that per day or per week?',
      );
    }
    expect(state.record.workload.activeTime.value?.stated).toMatch(/2 hours per day/i);
    expect(state.record.workload.activeTime.value?.weeklyHours).toBeNull();
    expect(state.record.staffing.location.value).toBe('remote');
    expect(state.assistantMessage).not.toMatch(/how much active working time/i);
  });

  it('keeps the opening wording in the model briefing after the transcript window moves on', () => {
    const record = createEmptyRecord();
    record.statements.push({
      id: 's1',
      topic: 'workload',
      text: 'I need two hours of remote support per day.',
      source: 'explicit',
      confidence: 'high',
    });
    record.workload.activeTime = explicitFact(workingTimeFromParts({ amount: 2, unit: 'day' }), 'I need two hours of remote support per day.');
    record.staffing.location = explicitFact('remote', 'I need two hours of remote support per day.');
    const messages = [
      { role: 'visitor' as const, text: 'I need two hours of remote support per day.' },
      ...Array.from({ length: 13 }, (_, index) => ({
        role: (index % 2 === 0 ? 'assistant' : 'visitor') as 'assistant' | 'visitor',
        text: `Later exchange ${index}.`,
      })),
    ];
    const briefing = buildAssessmentInput({ messages, record, asked: [] });
    expect(briefing).toContain('I need two hours of remote support per day.');
    expect(briefing).toMatch(/2 hours per day/);
    expect(briefing).toMatch(/Do not ask for the hours again/i);
    expect(briefing).toContain('Later exchange 12.');
    expect(summariseRecord(record)).toMatch(/weekly hours not calculated/);
  });

  it('preserves the record across a page refresh', () => {
    const store = new Map<string, string>();
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    });
    const applied = reply(createEmptyRecord(), [], 'I need two hours of remote support per day.', 'Noted.');
    saveSession({
      version: 2,
      openingNote: 'I need two hours of remote support per day.',
      messages: [
        { id: 'm1', role: 'visitor', text: 'I need two hours of remote support per day.' },
        { id: 'm2', role: 'assistant', text: applied.assistantMessage },
      ],
      record: applied.record,
      asked: applied.asked,
      pending: applied.pending,
      complete: applied.complete,
    });
    const restored = loadSession();
    expect(restored?.record.workload.activeTime.value?.unit).toBe('day');
    expect(restored?.record.workload.activeTime.value?.amount).toBe(2);
    expect(restored?.record.staffing.location.value).toBe('remote');
    clearSession();
    expect(loadSession()).toBeNull();
    vi.unstubAllGlobals();
  });

  it('corrects two hours per week to two hours per day and does not let a later turn revert it', () => {
    const first = reply(createEmptyRecord(), [], 'I need two hours per week.', 'Noted.');
    expect(first.record.workload.activeTime.value?.unit).toBe('week');
    const corrected = reply(first.record, first.asked, 'I said two hours per day, not per week.', 'Thanks, I have changed that.');
    expect(corrected.record.workload.activeTime.value?.unit).toBe('day');
    expect(corrected.record.workload.activeTime.value?.amount).toBe(2);
    expect(corrected.record.workload.activeTime.value?.weeklyHours).toBeNull();
    expect(corrected.record.workload.activeTime.revised).toBe(true);
    const model = blankModelTurn('Shall we leave it as a weekly figure?');
    model.workingTime.amount = 2;
    model.workingTime.unit = 'week';
    model.workingTime.correction = true;
    const later = applyModelTurn(corrected.record, 'The partners are away next month.', model, corrected.asked);
    expect(later.record.workload.activeTime.value?.unit).toBe('day');
    expect(later.record.workload.activeTime.value?.weeklyHours).toBeNull();
  });
});

describe('repetition and irrelevant categories', () => {
  it('records that there are no projects and follows the group-travel peaks instead', () => {
    const applied = reply(
      createEmptyRecord(),
      [],
      'No specific projects. Peak times at certain points in the year when we have group travel.',
      'Do you have any active projects or ongoing tasks besides these peaks?',
    );
    expect(applied.record.project.status).toBe('not_applicable');
    expect(applied.record.workload.peak.value).toMatch(/group travel/i);
    expect(applied.assistantMessage).toMatch(/group travel creates busier periods/i);
    expect(applied.assistantMessage).not.toMatch(/active projects/i);

    const again = reply(
      applied.record,
      applied.asked,
      'It is mainly the travel arrangements.',
      'Are there any active projects I should know about?',
    );
    expect(again.record.project.status).toBe('not_applicable');
    expect(again.assistantMessage).not.toMatch(/\bprojects?\b/i);
  });

  it('does not treat an unknown optional category as a required question', () => {
    const applied = reply(
      createEmptyRecord(),
      [],
      'No specific projects. Peak times at certain points in the year when we have group travel.',
      'Noted.',
    );
    expect(summariseRecord(applied.record)).toMatch(/not applicable/i);
    expect(applied.assistantMessage).not.toMatch(/which parts of the work/i);
  });
});

describe('proportionate questioning', () => {
  it('turns two hours a day across five days into 10 calculated hours without asking for exact times', () => {
    let state = reply(createEmptyRecord(), [], 'I need two hours of remote executive support per day for the diary and inbox.', 'Noted.');
    expect(state.record.workload.activeTime.value?.weeklyHours).toBeNull();
    state = reply(state.record, state.asked, 'Five days.', 'What time in the morning do you want cover to start?');
    expect(state.record.workload.activeTime.value?.daysPerWeek).toBe(5);
    expect(state.record.workload.activeTime.value?.weeklyHours).toBe(10);
    expect(state.record.workload.activeTime.value?.unit).toBe('day');
    state = reply(state.record, state.asked, 'In the morning and late afternoon.', 'What time in the morning and what time in the late afternoon?');
    expect(state.record.availability.window.value).toMatch(/Morning and late afternoon/);
    expect(state.record.assumptions.some((item) => /split-day coverage/i.test(item.text))).toBe(true);
    expect(state.assistantMessage).not.toMatch(/what time/i);
    expect(state.record.workload.activeTime.value?.weeklyHours).toBe(10);
  });

  it('keeps a volume question when the workload is complex', () => {
    const applied = reply(
      createEmptyRecord(),
      [],
      'We support three executives, deal with over 100 emails a day, and arrange a lot of external meetings.',
      'Roughly how many of those external meetings need arranging in a typical week?',
    );
    expect(applied.assistantMessage).toMatch(/how many of those external meetings/i);
    expect(applied.record.executive.responsibilities.value).toEqual(expect.arrayContaining(['Inbox management']));
  });

  it('keeps several facts from one everyday answer', () => {
    const applied = reply(
      createEmptyRecord(),
      [],
      "We're a 12 person consultancy. I need two hours a day, five days a week, working remotely, and the diary is the problem.",
      'Noted.',
    );
    expect(applied.record.business.sector.value).toBe('Consulting');
    expect(applied.record.business.size.value).toBe('12 people');
    expect(applied.record.workload.activeTime.value?.amount).toBe(2);
    expect(applied.record.workload.activeTime.value?.unit).toBe('day');
    expect(applied.record.workload.activeTime.value?.daysPerWeek).toBe(5);
    expect(applied.record.workload.activeTime.value?.weeklyHours).toBe(10);
    expect(applied.record.staffing.location.value).toBe('remote');
    expect(applied.record.executive.responsibilities.value).toEqual(expect.arrayContaining(['Diary management']));
  });

  it('accepts an unknown optional detail and does not ask for it again', () => {
    const first = reply(createEmptyRecord(), [], "I don't know which software we use.", 'Which systems do you use?');
    expect(first.record.process.skipped).toBe(true);
    const again = reply(first.record, first.asked, 'Still not sure.', 'Which software should we talk about?');
    expect(again.assistantMessage).not.toMatch(/software|systems/i);
  });

  it('reaches completion for a straightforward requirement without a schedule audit', () => {
    let state = reply(
      createEmptyRecord(),
      [],
      "We're a consultancy. The diary takes two hours per day, five days a week, and we want outsourced remote support.",
      'Noted.',
    );
    state = reply(state.record, state.asked, 'In the morning and late afternoon.', 'What time in the morning and what time in the late afternoon?');
    expect(state.complete).toBe(false);
    expect(state.assistantMessage).not.toMatch(/what time/i);
    state = reply(state.record, state.asked, "That's all.", 'I have a clear picture.', true);
    expect(state.complete).toBe(true);
    expect(state.assistantMessage).toMatch(/later phase/i);
    expect(state.assistantMessage).not.toMatch(/£|salary|I recommend/i);
    expect(state.record.workload.activeTime.value?.weeklyHours).toBe(10);
  });
});

describe('conversation quality', () => {
  it('answers a clarification without losing the hours already recorded', () => {
    const first = reply(createEmptyRecord(), [], 'The diary takes two hours per day.', 'Noted.');
    const applied = reply(
      first.record,
      first.asked,
      'What do you mean by availability?',
      'It means when someone has to be reachable, which can be longer than the hours of work. When would that be?',
    );
    expect(applied.record.workload.activeTime.value?.amount).toBe(2);
    expect(applied.record.workload.activeTime.value?.unit).toBe('day');
    expect(applied.assistantMessage).toMatch(/when someone has to be reachable/i);
  });

  it('uses a correction in the next question', () => {
    const first = reply(createEmptyRecord(), [], 'The diary takes two hours per week.', 'Noted.');
    const corrected = reply(first.record, first.asked, 'I said two hours per day, not per week.', 'Thank you. How many hours do you need?');
    expect(corrected.record.workload.activeTime.value?.unit).toBe('day');
    expect(corrected.record.workload.assessed.value).toBeNull();
    expect(corrected.assistantMessage).not.toMatch(/^thank you/i);
    expect(corrected.assistantMessage).not.toMatch(/how many hours|how many days/i);
  });

  it('drops a generic thank-you and keeps one real question', () => {
    const applied = reply(
      createEmptyRecord(),
      [],
      'We are a consultancy and the diary is taking over.',
      'Thank you for sharing that. Which parts of the work are taking the time?',
    );
    expect(applied.assistantMessage).not.toMatch(/^thank you/i);
    expect(applied.assistantMessage).toMatch(/\?/);
  });
});
