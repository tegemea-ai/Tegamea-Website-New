/**
 * Conversational intelligence: adaptive questions, preserved ranges, and precise negation.
 * Mocked model replies only. No OpenAI calls.
 */
import { describe, expect, it } from 'vitest';
import { applyModelTurn, blankModelTurn } from './applyTurn';
import { assistantParagraphs } from './messageFormat';
import { recommendRole } from './role/recommend';
import { createEmptyRecord, type AssessmentRecord } from './types';

function reply(record: AssessmentRecord, asked: string[], text: string, assistantMessage: string, suggestComplete = false) {
  const model = blankModelTurn(assistantMessage);
  model.suggestComplete = suggestComplete;
  return applyModelTurn(record, text, model, asked);
}

describe('conversational intelligence corrections', () => {
  it('walks the architecture-firm conversation without collapsing the meeting range or inventing hours', () => {
    let state = reply(
      createEmptyRecord(),
      [],
      "I'm a director of a boutique architecture firm and need an Executive Assistant for around 10 hours a week.",
      'How many hours should the EA work, and shall we start with project coordination?',
    );
    expect(state.assistantMessage).toMatch(/what would you most like your Executive Assistant to take off your plate/i);
    expect(state.assistantMessage).toMatch(/managing your inbox and diary/i);
    expect(state.assistantMessage).not.toMatch(/project coordination/i);
    expect(state.record.workload.requestedTime.value).toMatchObject({ amount: 10, unit: 'week' });
    expect(boldQuestions(state.assistantMessage)).toBe(true);

    state = reply(
      state.record,
      state.asked,
      'Email and diary management, sending documents to clients, and following up with staff on client work.',
      'How long do the meetings last?',
    );
    expect(state.assistantMessage).toMatch(/how many emails/i);
    expect(state.assistantMessage).not.toMatch(/how long|project coordination/i);

    state = reply(
      state.record,
      state.asked,
      'She filters emails, responds to routine enquiries and flags matters needing my attention. About 30 emails a day.',
      'Is that a light inbox, and what does she do with the emails?',
    );
    expect(state.record.workload.evidence.some((note) => /about 30 emails/i.test(note.text))).toBe(true);
    expect(state.assistantMessage).toMatch(/how many meetings/i);
    expect(state.assistantMessage).not.toMatch(/\blight\b|what would the assistant need to do with them/i);

    state = reply(
      state.record,
      state.asked,
      'A mixture of internal, client and external stakeholder meetings. About 10-15 arranged weekly. Occasional agendas, papers and action follow-up. Some of the coordination is more involved.',
      'Are those straightforward to arrange, or is the coordination more involved? How long do they last?',
    );
    const meetingNote = state.record.workload.evidence.map((note) => note.text).join(' ');
    expect(meetingNote).toMatch(/about 10–15 meetings/i);
    expect(meetingNote).not.toMatch(/about 15 meetings/i);
    expect(state.assistantMessage).not.toMatch(/straightforward to arrange|how long|minutes each/i);
    expect(state.record.workload.assessment?.complete).toBe(false);
    expect(state.record.workload.assessed.value).toBeNull();

    state = reply(
      state.record,
      state.asked,
      'The assistant does not need to attend meetings to take minutes.',
      'So no minutes, action summaries or follow-up notes are required. I recommend we finish.',
      true,
    );
    const evidence = state.record.workload.evidence.map((note) => note.text).join(' ');
    expect(evidence).toMatch(/attendance in order to take minutes is not required/i);
    expect(evidence).not.toMatch(/meetings are attended|minute preparation is not required/i);
    expect(state.assistantMessage).toMatch(/still prepare minutes/i);
    expect(state.assistantMessage).not.toMatch(/no minutes|I recommend|£/i);
    expect(state.complete).toBe(false);

    const recommendation = recommendRole(state.record);
    expect(recommendation?.role).toBe('Executive Assistant');
    expect(recommendation?.headline).toMatch(/Experienced Executive Assistant/);
    expect(recommendation?.assessmentComplete).toBe(false);
    expect(state.record.workload.agreed.value).toBeNull();
    expect(boldQuestions(state.assistantMessage)).toBe(true);
  });

  it('stores a meeting range from the visitor and does not reduce it to the last number', () => {
    const state = reply(createEmptyRecord(), [], 'About 10–15 meetings a week, all external and straightforward.', 'Noted.');
    const note = state.record.workload.evidence.map((item) => item.text).join(' ');
    expect(note).toMatch(/about 10–15 meetings a week/i);
    const scheduling = state.record.workload.assessment?.components.find((item) => item.id === 'scheduling');
    expect(scheduling).toMatchObject({ lowMinutes: 50, highMinutes: 150 });
  });

  it('asks once when a yes or no could refer to arranging or attending', () => {
    let state = reply(createEmptyRecord(), [], 'I need help with about 8 client meetings a week.', 'How many hours?');
    expect(state.assistantMessage).toMatch(/arrange them, attend them, or both/i);
    state = reply(state.record, state.asked, 'No.', 'Understood, so there is no diary work.');
    expect(state.record.workload.evidence.some((note) => /short reply did not identify/i.test(note.text))).toBe(true);
    expect(state.record.workload.evidence.some((note) => /meetings are attended|meetings are scheduled/i.test(note.text))).toBe(false);
    expect(state.assistantMessage).toMatch(/arranges the meetings, attends them, or both/i);
  });

  it('bolds the principal question when the model leaves it unmarked', () => {
    const state = reply(
      createEmptyRecord(),
      [],
      'I need an Executive Assistant.',
      'Managing an inbox is a common place to start. What would you most like your Executive Assistant to take off your plate?',
    );
    const paragraphs = assistantParagraphs(state.assistantMessage);
    const bold = paragraphs.flat().filter((run) => run.bold).map((run) => run.text);
    expect(bold).toEqual(['What would you most like your Executive Assistant to take off your plate?']);
  });
});

function boldQuestions(message: string): boolean {
  return assistantParagraphs(message).some((paragraph) => paragraph.some((run) => run.bold && run.text.endsWith('?')));
}
