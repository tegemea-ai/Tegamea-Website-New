/**
 * The live question order, with mocked model replies.
 * These tests check that the server keeps the conversation on the work.
 * They do not call OpenAI.
 */
import { describe, expect, it } from 'vitest';
import { applyModelTurn, blankModelTurn } from './applyTurn';
import { recommendRole } from './role/recommend';
import { createEmptyRecord, type AssessmentRecord } from './types';

const OPENING = 'I am a director of a growing accountancy firm and I need an EA.';

function reply(record: AssessmentRecord, asked: string[], text: string, assistantMessage: string, suggestComplete = false) {
  const model = blankModelTurn(assistantMessage);
  model.suggestComplete = suggestComplete;
  return applyModelTurn(record, text, model, asked);
}

describe('accountancy firm methodology', () => {
  it('asks what the EA would take on before asking about hours', () => {
    const applied = reply(
      createEmptyRecord(),
      [],
      OPENING,
      'How many hours per day or week do you expect the Executive Assistant to work?',
    );
    expect(applied.record.business.sector.value).toBe('Accountancy');
    expect(applied.record.executive.requestedRole.value).toBe('Executive Assistant');
    expect(applied.record.executive.responsibilities.value).toBeNull();
    expect(applied.record.workload.activeTime.value).toBeNull();
    expect(applied.assistantMessage).toMatch(/what would you most like your Executive Assistant to take off your plate/i);
    expect(applied.assistantMessage).not.toMatch(/how many hours/i);
  });

  it('keeps a volunteered daily range as an estimate and does not ask for days yet', () => {
    const opened = reply(createEmptyRecord(), [], OPENING, 'How many hours per day or week do you expect the Executive Assistant to work?');
    const applied = reply(
      opened.record,
      opened.asked,
      'Probably 2–3 hours per day.',
      'How many days per week?',
    );
    const time = applied.record.workload.activeTime.value;
    expect(time?.amount).toBe(2);
    expect(time?.amountTo).toBe(3);
    expect(time?.unit).toBe('day');
    expect(time?.weeklyHours).toBeNull();
    expect(applied.record.workload.requestedTime.value?.unit).toBe('day');
    expect(applied.record.workload.assessed.value).toBeNull();
    expect(applied.record.workload.agreed.value).toBeNull();
    expect(applied.assistantMessage).toMatch(/starting estimate/i);
    expect(applied.assistantMessage).not.toMatch(/how many days/i);
  });

  it('follows the inbox, the meetings, the chasing and the peaks instead of availability', () => {
    let state = reply(createEmptyRecord(), [], OPENING, 'How many hours would you like?');
    state = reply(state.record, state.asked, 'Probably 2–3 hours per day.', 'How many days per week?');
    state = reply(
      state.record,
      state.asked,
      'The main thing is a high-volume inbox.',
      'Do you require specific availability times or is flexibility acceptable?',
    );
    expect(state.record.executive.responsibilities.value).toEqual(expect.arrayContaining(['Inbox management']));
    expect(state.record.workload.evidence.some((note) => /high volume/i.test(note.text))).toBe(true);
    expect(state.assistantMessage).toMatch(/how many emails/i);
    expect(state.assistantMessage).not.toMatch(/availability|flexibility/i);

    state = reply(
      state.record,
      state.asked,
      'About 120 emails a day, and most of them need a reply rather than triage.',
      'What time does the day start?',
    );
    expect(state.record.workload.evidence.some((note) => /120 emails/i.test(note.text))).toBe(true);
    expect(state.assistantMessage).not.toMatch(/what time|how many emails/i);

    state = reply(
      state.record,
      state.asked,
      'I also coordinate multiple client meetings.',
      'How many hours should we allow for meetings?',
    );
    expect(state.record.executive.responsibilities.value).toEqual(expect.arrayContaining(['Client meeting coordination']));
    expect(state.assistantMessage).toMatch(/how many meetings/i);
    expect(state.assistantMessage).not.toMatch(/how many hours/i);

    state = reply(
      state.record,
      state.asked,
      'I spend a lot of time chasing staff for deliverables.',
      'Do you have projects as well?',
    );
    expect(state.record.project.notes.value).toEqual(expect.arrayContaining(['Chasing and follow-up']));
    expect(state.record.workload.evidence.some((note) => /chases staff/i.test(note.text))).toBe(true);
    expect(state.record.assumptions.some((item) => /blended role/i.test(item.text))).toBe(false);
    expect(recommendRole(state.record)?.role).toBe('Executive Assistant');
    expect(recommendRole(state.record)?.headline).toMatch(/client and project coordination/i);
    expect(state.assistantMessage).not.toMatch(/\bi recommend\b|\bblended role\b/i);

    state = reply(
      state.record,
      state.asked,
      'It gets much busier at year end.',
      'Do you require specific availability times?',
    );
    expect(state.record.workload.peak.value).toMatch(/busier/i);
    expect(state.assistantMessage).toMatch(/busier periods/i);
    expect(state.assistantMessage).not.toMatch(/availability/i);
    expect(state.record.workload.assessed.value).toBeNull();
    expect(state.record.workload.activeTime.value?.weeklyHours).toBeNull();
  });

  it('uses hours, duties and working preferences given in the opening without asking for them again', () => {
    const applied = reply(
      createEmptyRecord(),
      [],
      'I am a director of a growing accountancy firm. I need an EA for the inbox and diary, about two hours a day, five days a week, working remotely in the mornings. The inbox is about 80 emails a day and I coordinate external client meetings.',
      'How many hours per day or week do you expect the Executive Assistant to work, and how many days, and when do they need to be available?',
    );
    expect(applied.record.executive.requestedRole.value).toBe('Executive Assistant');
    expect(applied.record.executive.responsibilities.value).toEqual(
      expect.arrayContaining(['Inbox management', 'Diary management', 'Client meeting coordination']),
    );
    expect(applied.record.workload.activeTime.value?.amount).toBe(2);
    expect(applied.record.workload.activeTime.value?.daysPerWeek).toBe(5);
    expect(applied.record.workload.activeTime.value?.weeklyHours).toBe(10);
    expect(applied.record.staffing.location.value).toBe('remote');
    expect(applied.record.availability.window.value).toMatch(/Morning/);
    expect(applied.record.workload.evidence.some((note) => /80 emails/i.test(note.text))).toBe(true);
    expect(applied.record.workload.assessed.value).toBeNull();
    expect(applied.assistantMessage).not.toMatch(/how many hours|how many days|available|availability/i);
  });
});

describe('stage A acceptance', () => {
  it('A. asks about the work before hours when an accountancy director asks for an EA', () => {
    const applied = reply(createEmptyRecord(), [], OPENING, 'How many hours per day or week should the EA work?');
    expect(applied.assistantMessage).toMatch(/what would you most like your Executive Assistant to take off your plate/i);
    expect(applied.assistantMessage).not.toMatch(/how many hours/i);
    expect(applied.complete).toBe(false);
  });

  it('B. stores a volunteered 2–3 hours per day as requested time, not assessed time', () => {
    const opened = reply(createEmptyRecord(), [], OPENING, 'How many hours?');
    const applied = reply(opened.record, opened.asked, 'Probably 2–3 hours per day.', 'How many days a week is that?');
    expect(applied.record.workload.requestedTime.value).toMatchObject({ amount: 2, amountTo: 3, unit: 'day' });
    expect(applied.record.workload.assessed.value).toBeNull();
    expect(applied.record.workload.agreed.value).toBeNull();
    expect(applied.assistantMessage).not.toMatch(/how many days/i);
  });

  it('C. explores inbox, diary and team-chasing drivers and does not switch back to an hours form', () => {
    let state = reply(createEmptyRecord(), [], 'I need help with my inbox, my diary and chasing the team.', 'How many hours do you need, and on which days?');
    expect(state.assistantMessage).toMatch(/emails/i);
    expect(state.assistantMessage).not.toMatch(/how many hours|which days/i);
    state = reply(state.record, state.asked, 'About 40 emails, and most need a same-day reply rather than triage.', 'What time are you in the office?');
    expect(state.assistantMessage).toMatch(/how many meetings/i);
    expect(state.assistantMessage).not.toMatch(/what time|how many hours/i);
    state = reply(state.record, state.asked, 'Maybe six meetings a week, mostly with clients outside the firm.', 'How many hours should the chasing take?');
    expect(state.assistantMessage).toMatch(/arrange them, attend them, or both/i);
    expect(state.assistantMessage).not.toMatch(/how many hours|chasing or tracking/i);
    expect(state.record.workload.assessed.value).toBeNull();
  });

  it('D. does not ask about projects again after the visitor says there are none', () => {
    const applied = reply(
      createEmptyRecord(),
      [],
      'There are no projects. Group travel creates peaks at certain points in the year.',
      'What projects should we include?',
    );
    expect(applied.record.project.status).toBe('not_applicable');
    expect(applied.assistantMessage).toMatch(/group travel/i);
    expect(applied.assistantMessage).not.toMatch(/what projects/i);
    const again = reply(applied.record, applied.asked, 'Nothing else on that.', 'Do you have projects I should add?');
    expect(again.record.project.status).toBe('not_applicable');
    expect(again.assistantMessage).not.toMatch(/\bprojects?\b/i);
  });

  it('E. follows a seasonal group-travel peak instead of returning to a generic form', () => {
    const applied = reply(
      createEmptyRecord(),
      [],
      'No projects. Group travel creates peaks at certain points in the year.',
      'How many hours do you need?',
    );
    expect(applied.record.workload.peak.value).toMatch(/group travel/i);
    expect(applied.assistantMessage).toMatch(/additional support/i);
    expect(applied.assistantMessage).not.toMatch(/how many hours/i);
  });

  it('F. accepts morning and late-afternoon availability without demanding clock times', () => {
    const opened = reply(createEmptyRecord(), [], 'The diary takes about two hours a day.', 'Noted.');
    const applied = reply(opened.record, opened.asked, 'Mornings and late afternoon.', 'What exact time does the morning start and finish?');
    expect(applied.record.availability.window.value).toMatch(/Morning and late afternoon/i);
    expect(applied.assistantMessage).not.toMatch(/exact time|what time|o'clock/i);
  });

  it('G. keeps a correction from two hours per week to two hours per day', () => {
    const first = reply(createEmptyRecord(), [], 'I need two hours per week for the diary.', 'Noted.');
    expect(first.record.workload.requestedTime.value?.unit).toBe('week');
    const corrected = reply(first.record, first.asked, 'Sorry, I meant two hours per day, not per week.', 'Should I keep the weekly figure?');
    expect(corrected.record.workload.activeTime.value?.unit).toBe('day');
    expect(corrected.record.workload.activeTime.value?.amount).toBe(2);
    expect(corrected.record.workload.requestedTime.value?.unit).toBe('day');
    expect(corrected.record.workload.activeTime.revised).toBe(true);
    expect(corrected.record.workload.assessed.value).toBeNull();
    expect(corrected.assistantMessage).not.toMatch(/weekly figure|per week/i);
  });

  it('H. uses several facts from the opening and does not ask for them again', () => {
    const applied = reply(
      createEmptyRecord(),
      [],
      'I run a 12 person consultancy. I need an EA for the inbox and diary, two hours a day, five days a week, remotely, in the mornings. About 80 emails a day and external client meetings.',
      'How many hours, how many days, and when are they available?',
    );
    expect(applied.record.business.size.value).toBe('12 people');
    expect(applied.record.executive.requestedRole.value).toBe('Executive Assistant');
    expect(applied.record.workload.requestedTime.value?.unit).toBe('day');
    expect(applied.record.workload.requestedTime.value?.daysPerWeek).toBe(5);
    expect(applied.record.availability.window.value).toMatch(/Morning/);
    expect(applied.record.workload.assessed.value).toBeNull();
    expect(applied.assistantMessage).not.toMatch(/how many hours|how many days|available|availability/i);
  });

  it('I. keeps ten hours of active work distinct from extensive availability', () => {
    const applied = reply(
      createEmptyRecord(),
      [],
      'I need 10 hours of work on the inbox, but someone available for 40 hours a week.',
      'So that is 40 hours of work?',
    );
    expect(applied.record.workload.activeTime.value?.amount).toBe(10);
    expect(applied.record.workload.activeTime.value?.unit).toBe('week');
    expect(applied.record.workload.activeTime.value?.weeklyHours).not.toBe(40);
    expect(applied.record.availability.window.value).toMatch(/40 hours of availability/);
    expect(applied.record.workload.requestedTime.value?.amount).toBe(10);
    expect(applied.record.workload.assessed.value).toBeNull();
    expect(applied.assistantMessage).not.toMatch(/40 hours of work/i);
  });

  it('J. does not complete before the principal responsibilities are understood', () => {
    let state = reply(createEmptyRecord(), [], OPENING, 'How many hours and which days?');
    state = reply(state.record, state.asked, 'Probably 2–3 hours per day.', 'Outsourced or employed?');
    state = reply(state.record, state.asked, 'Outsourced.', 'I have a clear picture.', true);
    expect(state.record.executive.responsibilities.value).toBeNull();
    expect(state.record.staffing.model.value).toBe('outsourced');
    expect(state.complete).toBe(false);
    expect(state.assistantMessage).toMatch(/take off your plate|take on/i);
    expect(state.assistantMessage).not.toMatch(/later phase/i);
    const closing = reply(state.record, state.asked, "That's all.", 'I have a clear picture.', true);
    expect(closing.complete).toBe(false);
    expect(closing.record.workload.assessed.value).toBeNull();
    expect(closing.assistantMessage).toMatch(/take on/i);
  });

  it('asks about minutes only after the visitor mentions them', () => {
    const applied = reply(createEmptyRecord(), [], 'I need someone to take minutes in client meetings.', 'How many hours a week is that?');
    expect(applied.assistantMessage).toMatch(/minutes/i);
    expect(applied.assistantMessage).not.toMatch(/how many hours/i);
    const answered = reply(applied.record, applied.asked, 'They need to attend the meeting and write a full note.', 'Do they need to take minutes?');
    expect(answered.assistantMessage).not.toMatch(/do they need to take minutes/i);
    expect(answered.record.workload.assessed.value).toBeNull();
  });
});
