import { describe, expect, it } from 'vitest';
import { applyModelTurn, blankModelTurn } from '../applyTurn';
import { createEmptyRecord, type AssessmentRecord } from '../types';
import { hypothesisFrom } from './hypothesis';
import { clientResult, recommendRole } from './recommend';

function reply(record: AssessmentRecord, asked: string[], text: string, assistantMessage: string) {
  return applyModelTurn(record, text, blankModelTurn(assistantMessage), asked);
}

const MEDIA =
  'I run a growing media agency and need someone to coordinate client projects. There are approximately ten active client accounts. The work is tracking project progress, coordinating client and project-lead communications, monitoring actions and deadlines, arranging project meetings, and using Asana. Issues need escalating when they slip.';

describe('role hypothesis', () => {
  it('reads a media-agency project brief as project support and keeps the responsibilities', () => {
    const state = reply(createEmptyRecord(), [], MEDIA, 'Is this an Executive Assistant who will do some routine chasing?');
    const recommendation = recommendRole(state.record);
    const listed = recommendation?.responsibilities.join(' ') ?? '';
    expect(recommendation?.role).toBe('Project Support');
    expect(recommendation?.headline).toBe('Project Coordinator / Project Support');
    expect(listed).toMatch(/ten active client accounts/i);
    expect(listed).toMatch(/Tracking project progress/);
    expect(listed).toMatch(/Coordinating client and project-lead communications/);
    expect(listed).toMatch(/Monitoring deadlines/);
    expect(listed).toMatch(/Coordinating project meetings/);
    expect(listed).toMatch(/Tracking actions and escalating issues/);
    expect(listed).toMatch(/Asana as the project system/);
    expect(listed).not.toMatch(/Routine client follow-up and action tracking/);
    expect(state.record.executive.responsibilities.value ?? []).not.toContain('Scheduling');
    expect(state.record.workload.assessed.value).toBeNull();
    expect(state.record.workload.agreed.value).toBeNull();
    expect(recommendation?.workloadStatement).toMatch(/no hours have been assumed|no allowance has been invented/i);
    expect(recommendation?.explanation).not.toMatch(/two employees|two placements/);
    expect(state.assistantMessage).toMatch(/coordinate the work, or also direct/i);
    expect(state.assistantMessage).not.toMatch(/actively manage|£/);
  });

  it('keeps an executive brief with routine chasing as one Executive Assistant', () => {
    const director = reply(
      createEmptyRecord(),
      [],
      'I am a director. I need help with my inbox, my diary, correspondence, and routine chasing of actions.',
      'Should this be a project manager?',
    );
    expect(recommendRole(director.record)?.role).toBe('Executive Assistant');
    expect(recommendRole(director.record)?.headline).toMatch(/Experienced Executive Assistant, including client and project coordination/);
    expect(recommendRole(director.record)?.responsibilities).toEqual(
      expect.arrayContaining(['Inbox management', 'Diary and scheduling', 'Correspondence', 'Routine client follow-up and action tracking']),
    );

    const occasional = reply(
      createEmptyRecord(),
      [],
      'I need an Executive Assistant for my inbox and diary, and they would occasionally chase actions.',
      'Is that a second role?',
    );
    expect(recommendRole(occasional.record)?.role).toBe('Executive Assistant');
    expect(recommendRole(occasional.record)?.explanation).not.toMatch(/blended remit|two employees/);
  });

  it('reads recurring operational work as operations coordination', () => {
    const state = reply(
      createEmptyRecord(),
      [],
      'We need someone to look after recurring operational workflows, supplier coordination and client onboarding.',
      'Is an Executive Assistant the right default?',
    );
    const recommendation = recommendRole(state.record);
    expect(recommendation?.role).toBe('Operations Coordinator');
    expect(recommendation?.responsibilities).toEqual(
      expect.arrayContaining(['Recurring operational workflows', 'Supplier coordination', 'Client onboarding']),
    );
    expect(recommendation?.explanation).toMatch(/one remit/);
    expect(recommendation?.explanation).not.toMatch(/two employees|Executive Assistant brief/);
  });

  it('treats substantial executive support plus project coordination as one blended remit', () => {
    const state = reply(
      createEmptyRecord(),
      [],
      'I need my inbox and diary managed, plus correspondence and document preparation. I also need this person to coordinate twelve client projects, track milestones and deadlines, and keep the project board up to date.',
      'Do you need two people?',
    );
    const recommendation = recommendRole(state.record);
    expect(recommendation?.role).toBe('Blended arrangement');
    expect(recommendation?.headline).toMatch(/Executive and project support in one remit/);
    expect(recommendation?.explanation).toMatch(/one blended remit/);
    expect(recommendation?.explanation).not.toMatch(/two employees|two placements/);
    expect(recommendation?.responsibilities.join(' ')).toMatch(/Inbox management/);
    expect(recommendation?.responsibilities.join(' ')).toMatch(/twelve client projects/i);
    expect(recommendation?.staffing).not.toMatch(/£|two people/);
  });

  it('treats project coordination plus operational processes as one blended remit', () => {
    const state = reply(
      createEmptyRecord(),
      [],
      'Please coordinate eight client projects, track deadlines and keep Asana updated. The same person also runs our recurring operational processes, supplier coordination and staff onboarding.',
      'Shall I price two roles?',
    );
    const recommendation = recommendRole(state.record);
    expect(recommendation?.role).toBe('Blended arrangement');
    expect(recommendation?.headline).toMatch(/Project and operations coordination in one remit/);
    expect(recommendation?.explanation).toMatch(/one blended remit/);
    expect(recommendation?.explanation).not.toMatch(/two employees|two placements|£/);
    expect(recommendation?.responsibilities.join(' ')).toMatch(/Asana as the project system/);
    expect(recommendation?.responsibilities.join(' ')).toMatch(/Supplier coordination/);
    expect(recommendation?.responsibilities.join(' ')).toMatch(/Client onboarding/);
  });

  it('changes the leading role when later evidence replaces the early title', () => {
    let state = reply(
      createEmptyRecord(),
      [],
      'I need an Executive Assistant to manage my inbox and diary.',
      'What should they take on?',
    );
    expect(recommendRole(state.record)?.role).toBe('Executive Assistant');
    state = reply(
      state.record,
      state.asked,
      'Ignore the inbox and diary. The role is to coordinate ten client projects, monitor deadlines and maintain them in Asana.',
      'So this stays an Executive Assistant?',
    );
    const recommendation = recommendRole(state.record);
    expect(state.record.executive.requestedRole.value).toBe('Executive Assistant');
    expect(recommendation?.role).toBe('Project Support');
    expect(recommendation?.responsibilities.join(' ')).toMatch(/ten client projects/i);
    expect(recommendation?.responsibilities.join(' ')).toMatch(/Asana/);
    expect(recommendation?.responsibilities.join(' ')).not.toMatch(/Inbox management/);
    expect(recommendation?.explanation).toMatch(/requested title does not decide/i);
  });

  it('does not fall back to an Executive Assistant when the evidence is too thin', () => {
    const state = reply(createEmptyRecord(), [], 'I need someone to chase a few things from time to time.', 'Shall I assume an Executive Assistant?');
    expect(hypothesisFrom(state.record).primary).toBe('uncertain');
    expect(recommendRole(state.record)).toBeNull();
    expect(clientResult(state.record)).toBeNull();
  });

  it('does not drop earlier project facts when a later answer only settles autonomy', () => {
    let state = reply(createEmptyRecord(), [], MEDIA, 'What is the role?');
    state = reply(
      state.record,
      state.asked,
      'They would coordinate, not direct delivery or manage people.',
      'How many hours should we invent?',
    );
    const listed = recommendRole(state.record)?.responsibilities.join(' ') ?? '';
    expect(recommendRole(state.record)?.role).toBe('Project Support');
    expect(listed).toMatch(/ten active client accounts/i);
    expect(listed).toMatch(/Asana as the project system/);
    expect(listed).toMatch(/Coordinating project meetings/);
    expect(state.record.workload.assessed.value).toBeNull();
    expect(state.record.workload.assessment?.complete).not.toBe(true);
  });
});
