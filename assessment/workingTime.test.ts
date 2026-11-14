import { describe, expect, it } from 'vitest';
import { buildReview } from './coverage';
import { createSession, replyTo } from './simulator';
import type { AssessmentSession, ReviewItem } from './types';
import { readWorkingTime } from './workingTime';

function reply(session: AssessmentSession, text: string): AssessmentSession {
  return replyTo(session, text);
}

function atWorkload(): AssessmentSession {
  const session = reply(createSession(null), 'I run a small consultancy and the diary is taking over.');
  expect(session.pending).toBe('workload');
  return session;
}

function lastAssistant(session: AssessmentSession): string {
  return [...session.messages].reverse().find((message) => message.role === 'assistant')?.text ?? '';
}

function workloadItems(session: AssessmentSession): ReviewItem[] {
  return buildReview(session.record).find((section) => section.title === 'Workload')?.items ?? [];
}

describe('working hours', () => {
  it('converts 2 hours per day across 5 stated days into 10 hours per week', () => {
    const session = reply(atWorkload(), '2 hours per day, 5 days per week.');
    const time = session.record.workload.activeTime.value;

    expect(time?.unit).toBe('day');
    expect(time?.amount).toBe(2);
    expect(time?.daysPerWeek).toBe(5);
    expect(time?.weeklyHours).toBe(10);
    expect(time?.needsClarification).toBe(false);
    expect(time?.stated).toMatch(/per day/i);
    expect(time?.stated).not.toMatch(/per week/i);

    const message = lastAssistant(session);
    expect(message).toMatch(/2 hours per day/i);
    expect(message).toMatch(/10 hours per week/);
    expect(message).toMatch(/calculated/i);
    expect(message).not.toMatch(/2 hours (?:a|per) week/i);
    expect(session.pending).not.toBe('schedule');

    const derived = workloadItems(session).find((item) => item.kind === 'derived');
    expect(derived?.detail).toMatch(/10 hours per week/);
    expect(derived?.detail).toMatch(/calculated/i);
  });

  it('does not convert 2 hours per day when the working days are unknown', () => {
    const session = reply(atWorkload(), '2 hours per day.');
    const time = session.record.workload.activeTime.value;

    expect(time?.unit).toBe('day');
    expect(time?.amount).toBe(2);
    expect(time?.daysPerWeek).toBeNull();
    expect(time?.weeklyHours).toBeNull();
    expect(time?.needsClarification).toBe(true);
    expect(session.pending).toBe('schedule');

    const message = lastAssistant(session);
    expect(message).toMatch(/2 hours per day/i);
    expect(message).toMatch(/will not assume a five-day week/i);
    expect(message).not.toMatch(/2 hours (?:a|per) week/i);
    expect(message).not.toMatch(/10 hours/);

    const weekly = workloadItems(session).find((item) => item.label === 'Weekly total');
    expect(weekly?.kind).toBe('unknown');
    expect(weekly?.detail).toMatch(/has not been converted/i);
  });

  it('keeps 2 hours per week as 2 hours per week', () => {
    const session = reply(atWorkload(), '2 hours per week.');
    const time = session.record.workload.activeTime.value;

    expect(time?.unit).toBe('week');
    expect(time?.weeklyHours).toBe(2);
    expect(time?.needsClarification).toBe(false);
    expect(time?.stated).toMatch(/2 hours per week/i);
    expect(lastAssistant(session)).toMatch(/2 hours per week/i);
    expect(lastAssistant(session)).not.toMatch(/per day/i);
    expect(workloadItems(session).some((item) => item.kind === 'derived')).toBe(false);
  });

  it('does not multiply a weekly figure by a number of days', () => {
    const session = reply(atWorkload(), '2 hours per week, 5 days per week.');
    expect(session.record.workload.activeTime.value?.weeklyHours).toBe(2);
    expect(session.record.workload.activeTime.value?.unit).toBe('week');
  });

  it('corrects a weekly figure to daily hours without inventing the days', () => {
    let session = reply(atWorkload(), '2 hours per week.');
    session = reply(session, 'I said 2 hours per day, not per week.');
    const time = session.record.workload.activeTime.value;

    expect(time?.unit).toBe('day');
    expect(time?.amount).toBe(2);
    expect(time?.weeklyHours).toBeNull();
    expect(time?.daysPerWeek).toBeNull();
    expect(time?.needsClarification).toBe(true);
    expect(session.pending).toBe('schedule');
    expect(session.messages.some((message) => message.role === 'visitor' && /not per week/i.test(message.text))).toBe(true);

    const message = lastAssistant(session);
    expect(message).toMatch(/corrected that to 2 hours per day/i);
    expect(message).not.toMatch(/10/);
    expect(message).not.toMatch(/2 hours per week/i);

    const confirmed = workloadItems(session).find((item) => item.label === 'Active working time');
    expect(confirmed?.detail).toMatch(/2 hours per day/i);
    expect(confirmed?.detail).not.toMatch(/per week/i);
    expect(workloadItems(session).some((item) => item.kind === 'derived')).toBe(false);
  });

  it('corrects daily hours to a weekly figure and drops the old weekly total', () => {
    let session = reply(atWorkload(), '2 hours per day, 5 days per week.');
    expect(session.record.workload.activeTime.value?.weeklyHours).toBe(10);

    session = reply(session, "Actually it's 2 hours a week, not per day.");
    const time = session.record.workload.activeTime.value;

    expect(time?.unit).toBe('week');
    expect(time?.weeklyHours).toBe(2);
    expect(time?.daysPerWeek).toBeNull();
    expect(time?.needsClarification).toBe(false);
    expect(time?.stated).toMatch(/2 hours a week/i);

    const message = lastAssistant(session);
    expect(message).toMatch(/corrected the active working time to 2 hours a week/i);
    expect(message).not.toMatch(/active working time to 10/i);

    const current = workloadItems(session).filter((item) => item.kind !== 'words');
    expect(JSON.stringify(current)).not.toMatch(/10 hours/);
    expect(current.some((item) => /2 hours a week/i.test(item.detail))).toBe(true);
  });

  it('keeps a 40-hour availability figure out of a 10-hour workload', () => {
    const time = readWorkingTime(
      'I need 10 hours of work, but someone available for 40 hours a week.',
      'workload',
      null,
    );
    expect(time?.amount).toBe(10);
    expect(time?.weeklyHours).toBe(10);
    expect(time?.weeklyHours).not.toBe(40);
  });

  it('uses a later day count, and does not reuse availability as working days', () => {
    let session = reply(atWorkload(), '2 hours per day.');
    session = reply(session, '5 days per week');
    expect(session.record.workload.activeTime.value?.weeklyHours).toBe(10);
    expect(session.pending).not.toBe('schedule');
    expect(lastAssistant(session)).toMatch(/calculated/i);

    let separate = reply(createSession(null), 'Someone needs to be available Monday to Friday.');
    separate = reply(separate, 'The diary work takes 2 hours per day.');
    expect(separate.record.availability.workingDays.value).toMatch(/Monday to Friday/);
    expect(separate.record.workload.activeTime.value?.weeklyHours).toBeNull();
    expect(separate.record.workload.activeTime.value?.needsClarification).toBe(true);
    expect(separate.pending).toBe('schedule');
  });
});

describe('process question and corrections', () => {
  function untilProcess(): AssessmentSession {
    let session = reply(createSession(null), 'I run a consultancy and the diary is taking the time.');
    session = reply(session, 'It takes 2 hours per week.');
    session = reply(session, 'They would need to be available from 9am to 5pm.');
    session = reply(session, 'Outsourced, and remotely.');
    expect(session.pending).toBe('process');
    return session;
  }

  it('asks the process question in plain language and allows a skip', () => {
    const session = untilProcess();
    const message = lastAssistant(session);
    expect(message).toMatch(/copying information between spreadsheets/i);
    expect(message).toMatch(/You can skip this/);
    expect(message).not.toMatch(/rather than by adding a person/i);

    const skipped = reply(session, 'skip');
    expect(skipped.record.process.skipped).toBe(true);
    expect(skipped.pending).not.toBe('process');
    const review = buildReview(skipped.record).find((section) => section.title === 'Process improvement');
    expect(review?.items[0]?.detail).toMatch(/Nothing was assumed/i);
  });

  it('does not ask the process question when the visitor has already described it', () => {
    let session = reply(
      createSession(null),
      'The diary takes 2 hours per week, and we spend time manually copying information between spreadsheets.',
    );
    session = reply(session, 'Available from 9am to 5pm.');
    session = reply(session, 'Outsourced and remote.');
    expect(session.pending).toBe('close');
    expect(session.messages.some((message) => message.role === 'assistant' && /could be made easier/i.test(message.text))).toBe(
      false,
    );
  });

  it('keeps a hours correction off the process question and still asks for the missing days', () => {
    let session = untilProcess();
    session = reply(session, 'I said 2 hours per day, not per week.');
    expect(session.record.process.skipped).toBe(false);
    expect(session.record.workload.activeTime.value?.unit).toBe('day');
    expect(session.record.workload.activeTime.value?.weeklyHours).toBeNull();
    expect(session.pending).toBe('schedule');

    session = reply(session, '5');
    expect(session.record.workload.activeTime.value?.weeklyHours).toBe(10);
    expect(session.pending).toBe('process');
  });
});
