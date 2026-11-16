import { describe, expect, it } from 'vitest';
import { applyModelTurn, blankModelTurn } from '../applyTurn';
import { createEmptyRecord, type AssessmentRecord } from '../types';
import { clientResult, recommendRole } from './recommend';

function reply(record: AssessmentRecord, asked: string[], text: string, assistantMessage: string) {
  return applyModelTurn(record, text, blankModelTurn(assistantMessage), asked);
}

const ARCHITECTURE =
  'I am a director of a boutique architecture firm. I need an EA for 10 hours per week. About 30 emails a day, about 15 meetings a week, sending documents to clients, around 20 client projects, and routine chasing and action tracking.';

describe('architecture firm role reading', () => {
  it('recommends an experienced EA and asks whether the meetings are attended or scheduled', () => {
    const state = reply(createEmptyRecord(), [], ARCHITECTURE, 'Is the inbox light, and should this be a blended role?');
    const recommendation = recommendRole(state.record);
    expect(state.record.business.sector.value).toBe('Property and construction');
    expect(state.record.executive.requestedRole.value).toBe('Executive Assistant');
    expect(state.record.workload.requestedTime.value?.amount).toBe(10);
    expect(state.record.workload.requestedTime.value?.unit).toBe('week');
    expect(state.record.workload.assessed.value).toBeNull();
    expect(state.record.workload.agreed.value).toBeNull();
    expect(state.record.workload.assessment?.complete).toBe(false);
    expect(recommendation?.role).toBe('Executive Assistant');
    expect(recommendation?.headline).toMatch(/Experienced Executive Assistant, including client and project coordination/);
    expect(recommendation?.explanation).not.toMatch(/blended role|second role is indicated/i);
    expect(recommendation?.assessmentComplete).toBe(false);
    expect(recommendation?.workloadStatement).toMatch(/not a complete assessment/i);
    expect(recommendation?.workloadStatement).not.toMatch(/\blight\b|£/);
    expect(recommendation?.responsibilities).toEqual(
      expect.arrayContaining(['Inbox management', 'Sending documents to clients', 'Routine client follow-up and action tracking']),
    );
    expect(state.record.assumptions.some((item) => /blended role/i.test(item.text))).toBe(false);
    expect(state.assistantMessage).toMatch(/arrange them, attend them, or both/i);
    expect(state.assistantMessage).toMatch(/\*\*/);
    expect(state.assistantMessage).not.toMatch(/light|blended role|chasing or tracking|operational coordination|£/i);
    expect(state.record.executive.responsibilities.value).not.toContain('Document preparation');
  });

  it('asks what happens to the emails after the meetings are distinguished, still without inventing hours', () => {
    let state = reply(createEmptyRecord(), [], ARCHITECTURE, 'Is the inbox light?');
    state = reply(state.record, state.asked, 'She would need to attend them.', 'So the inbox is light?');
    const recommendation = recommendRole(state.record);
    expect(recommendation?.role).toBe('Executive Assistant');
    expect(recommendation?.responsibilities).toContain('Attending meetings');
    expect(state.record.workload.assessment?.components.find((item) => item.id === 'scheduling')).toBeUndefined();
    expect(state.assistantMessage).toMatch(/what would the assistant need to do with them/i);
    expect(state.assistantMessage).not.toMatch(/\blight\b|£|\d+\s*minutes/i);
    expect(state.record.workload.assessed.value).toBeNull();
  });

  it('moves off a single EA brief when the visitor describes substantive project management', () => {
    const state = reply(
      createEmptyRecord(),
      [],
      'I need an EA for the inbox and diary. The assistant must plan and run the 20 projects and manage a project coordinator.',
      'So this is still a standard EA?',
    );
    expect(recommendRole(state.record)?.role).toBe('Blended arrangement');
    expect(state.record.workload.assessed.value).toBeNull();
    expect(state.assistantMessage).not.toMatch(/£/);
  });

  it('shows the leading role, the request and the incomplete range, and leaves out empty evidence rows', () => {
    const state = reply(createEmptyRecord(), [], ARCHITECTURE, 'Noted.');
    const view = clientResult(state.record);
    expect(view?.headline).toMatch(/Executive Assistant/);
    expect(view?.status).toMatch(/weekly workload range is still incomplete/i);
    const titles = view?.sections.map((section) => section.title);
    expect(titles).toEqual(
      expect.arrayContaining(['Why this role', 'Main responsibilities', 'Weekly workload', 'Hours you asked for', 'Staffing', 'Assumptions that could change this']),
    );
    const text = view?.sections.map((section) => section.body.join(' ')).join(' ');
    expect(text).toMatch(/10 hours per week/);
    expect(text).toMatch(/not a price/i);
    expect(text).not.toMatch(/Not confirmed|Not discussed|In your words|£|\blight\b/);
  });
});
