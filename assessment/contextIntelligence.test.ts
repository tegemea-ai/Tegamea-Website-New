/**
 * Contextual interpretation and the shared opening question.
 * Mocked model replies only.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { applyModelTurn, blankModelTurn } from './applyTurn';
import { OPENING_EXAMPLE, OPENING_QUESTION, WELCOME } from './conversation';
import { interpretReply } from './contextReply';
import { createEmptyRecord, type AssessmentRecord } from './types';

function reply(record: AssessmentRecord, asked: string[], text: string, assistantMessage: string, suggestComplete = false, priorAssistant = '') {
  const model = blankModelTurn(assistantMessage);
  model.suggestComplete = suggestComplete;
  return applyModelTurn(record, text, model, asked, priorAssistant);
}

const EXAMPLES =
  'What would you most like your Executive Assistant to take off your plate?\n\nFor example, managing your inbox, scheduling meetings or coordinating with clients.';

describe('opening experience', () => {
  it('uses one opening question, with the example kept separate from the answer', () => {
    expect(OPENING_QUESTION).toBe("Tell me a little about your business and what you'd like help with.");
    expect(WELCOME).toContain(OPENING_QUESTION);
    expect(WELCOME).toContain(OPENING_EXAMPLE);
    expect(WELCOME).toContain('For example');
    const homepage = readFileSync('components/home/AssessmentPreview.tsx', 'utf8');
    expect(homepage).toContain('OPENING_QUESTION');
    expect(homepage).toContain('OPENING_EXAMPLE');
    expect(homepage).not.toContain('coordinating projects and chasing tasks');
  });
});

describe('adaptive opening', () => {
  it('asks what the EA would take on when the business, role and hours are already known', () => {
    const state = reply(
      createEmptyRecord(),
      [],
      'I run an architecture firm and need an EA for 15 hours a week.',
      "Tell me a little about your business and what you'd like help with.",
    );
    expect(state.record.business.sector.value).toBe('Property and construction');
    expect(state.record.executive.requestedRole.value).toBe('Executive Assistant');
    expect(state.record.workload.requestedTime.value).toMatchObject({ amount: 15, unit: 'week' });
    expect(state.assistantMessage).toMatch(/take off your plate/i);
    expect(state.assistantMessage).not.toMatch(/tell me a little about your business/i);
  });

  it('explores the workload when the problems are already named', () => {
    const state = reply(
      createEmptyRecord(),
      [],
      "I run a consultancy and I'm overwhelmed by emails and client meetings.",
      'What tasks do you need help with?',
    );
    expect(state.record.business.sector.value).toBe('Consulting');
    expect(state.record.executive.responsibilities.value).toEqual(expect.arrayContaining(['Inbox management', 'Client meeting coordination']));
    expect(state.assistantMessage).toMatch(/how many emails/i);
    expect(state.assistantMessage).not.toMatch(/what you'd like help with|what tasks do you need/i);
  });

  it('establishes the business and the pressure before a role or hours when the visitor is unsure', () => {
    const state = reply(createEmptyRecord(), [], "I need some help but I'm not sure what kind.", 'How many hours, and which role?');
    expect(state.record.executive.responsibilities.value).toBeNull();
    expect(state.record.executive.requestedRole.value).toBeNull();
    expect(state.record.workload.activeTime.value).toBeNull();
    expect(state.assistantMessage).toMatch(/what sort of business is it, and where is the work starting to build up/i);
    expect(state.assistantMessage).not.toMatch(/how many hours|executive assistant/i);
  });
});

describe('replies that refer to the previous question', () => {
  it('confirms every example in the immediately previous question', () => {
    const opened = reply(createEmptyRecord(), [], 'I need an Executive Assistant.', 'How many hours?');
    const state = reply(opened.record, opened.asked, 'Yes to all of that.', 'What would you like the EA to take off your plate?', false, opened.assistantMessage);
    expect(state.record.executive.responsibilities.value).toEqual(
      expect.arrayContaining(['Inbox management', 'Diary management', 'Scheduling', 'Document preparation']),
    );
    expect(state.record.project.notes.value).toEqual(expect.arrayContaining(['Chasing and follow-up']));
    expect(state.record.workload.evidence.some((note) => /volume and complexity were not confirmed/i.test(note.text))).toBe(true);
    expect(state.assistantMessage).toMatch(/how many emails/i);
    expect(state.assistantMessage).not.toMatch(/take off your plate/i);
  });

  it('drops the responsibility the visitor excludes', () => {
    const state = reply(createEmptyRecord(), [], 'Everything except client coordination.', 'Which responsibilities?', false, EXAMPLES);
    expect(state.record.executive.responsibilities.value).toEqual(expect.arrayContaining(['Inbox management', 'Scheduling']));
    expect(state.record.executive.responsibilities.value ?? []).not.toContain('Client meeting coordination');
  });

  it('uses only the examples named by position', () => {
    const reading = interpretReply(EXAMPLES, 'The first two');
    expect(reading?.kind).toBe('confirmed');
    if (reading?.kind === 'confirmed') {
      expect(reading.phrases).toEqual(['managing your inbox', 'scheduling meetings']);
      expect(reading.executive).not.toContain('Client meeting coordination');
    }
  });

  it('does not borrow examples from a question that offered none', () => {
    const state = reply(
      createEmptyRecord(),
      [],
      'Yes to all of that.',
      'Let us go back to the earlier examples.',
      false,
      'Roughly how many meetings are in a typical week?',
    );
    expect(state.record.executive.responsibilities.value).toBeNull();
    expect(state.assistantMessage).toMatch(/which examples did you mean/i);
  });
});

describe('diary, complexity and uncertainty', () => {
  it('does not ask whether a confirmed diary includes arranging', () => {
    let state = reply(createEmptyRecord(), [], 'I need diary management.', 'How many hours?');
    expect(state.record.executive.responsibilities.value).toEqual(expect.arrayContaining(['Diary management', 'Scheduling']));
    state = reply(state.record, state.asked, 'About 12 meetings a week.', 'Would the assistant arrange them, attend them, or both?');
    expect(state.assistantMessage).toMatch(/beyond arranging/i);
    expect(state.assistantMessage).not.toMatch(/arrange them, attend them/i);
  });

  it('treats international meetings as a signal and does not treat the whole volume as managed', () => {
    const state = reply(
      createEmptyRecord(),
      [],
      'I need an EA. I have about 20 international Teams meetings each week.',
      'Are those complex, and how long do they last?',
    );
    const evidence = state.record.workload.evidence.map((note) => note.text).join(' ');
    expect(evidence).toMatch(/share of that volume was not confirmed/i);
    expect(evidence).toMatch(/complexity signal, not a record that the coordination is complex/i);
    expect(evidence).not.toMatch(/meetings described as more involved/i);
    expect(state.assistantMessage).toMatch(/different time zones/i);
    expect(state.assistantMessage).toMatch(/beyond arranging/i);
    expect(state.record.workload.assessment?.components.find((item) => item.id === 'scheduling')?.lowMinutes ?? null).toBeNull();
    expect(state.record.workload.assessed.value).toBeNull();
  });

  it('does not ask whether scheduling is straightforward after the visitor has said it is complex', () => {
    const state = reply(
      createEmptyRecord(),
      [],
      'The assistant arranges about 8 external meetings a week and the coordination is complex.',
      'Are those straightforward to arrange, or is the coordination more involved?',
    );
    expect(state.record.workload.evidence.some((note) => /more involved/i.test(note.text))).toBe(true);
    expect(state.assistantMessage).not.toMatch(/straightforward to arrange/i);
  });

  it('keeps follow-up when the frequency is unknown and does not invent hours', () => {
    let state = reply(
      createEmptyRecord(),
      [],
      'I need someone to follow up with clients and staff on outstanding actions.',
      'How many hours should that take?',
    );
    expect(state.assistantMessage).toMatch(/how often does that follow-up/i);
    state = reply(state.record, state.asked, "I'm unsure.", 'Could you estimate the minutes?');
    expect(state.record.workload.evidence.some((note) => /how often it happens was not known/i.test(note.text))).toBe(true);
    expect(state.record.assumptions.some((item) => /no hours have been assumed/i.test(item.text))).toBe(true);
    expect(state.assistantMessage).toMatch(/across several clients or projects/i);
    expect(state.record.workload.assessed.value).toBeNull();
    expect(state.record.workload.agreed.value).toBeNull();
    expect(state.assistantMessage).not.toMatch(/\d+\s*minutes|£/);
  });

  it('does not treat an email count as the number that need drafting', () => {
    const state = reply(createEmptyRecord(), [], 'About 40 emails a day need an eye kept on them.', 'Is that 40 replies?');
    const evidence = state.record.workload.evidence.map((note) => note.text).join(' ');
    expect(evidence).toMatch(/about 40 emails/i);
    expect(evidence).toMatch(/not the number that need drafting/i);
    expect(state.record.workload.assessment?.components.find((item) => item.id === 'inbox')?.status).toBe('unquantified');
    expect(state.record.workload.assessed.value).toBeNull();
  });
});
