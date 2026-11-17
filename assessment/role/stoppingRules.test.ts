import { describe, expect, it } from 'vitest';
import { applyModelTurn, blankModelTurn } from '../applyTurn';
import { createEmptyRecord, type AssessmentRecord } from '../types';
import { clientResult, recommendRole } from './recommend';

function reply(record: AssessmentRecord, asked: string[], text: string, assistantMessage: string) {
  return applyModelTurn(record, text, blankModelTurn(assistantMessage), asked);
}

const FREQUENCY = /how often|how regularly|how frequent|across several clients or projects|individual requests as they arise/i;

const MEDIA =
  'I run a growing media agency and need someone to coordinate client projects. There are approximately ten active client accounts. The work is tracking project progress, coordinating client and project-lead communications, monitoring actions and deadlines, arranging project meetings, and using Asana.';

describe('stopping rules and workload handoff', () => {
  it('does not ask a media agency for follow-up frequency or a reporting substitute', () => {
    let state = reply(createEmptyRecord(), [], MEDIA, 'How often does the follow-up come up in a typical week?');
    expect(state.assistantMessage).not.toMatch(FREQUENCY);
    expect(recommendRole(state.record)?.role).toBe('Project Support');
    expect(recommendRole(state.record)?.responsibilities.join(' ')).toMatch(/ten active client accounts/i);
    expect(recommendRole(state.record)?.responsibilities.join(' ')).toMatch(/Asana as the project system/);
    expect(state.record.workload.assessed.value).toBeNull();
    expect(state.record.workload.agreed.value).toBeNull();

    state = reply(
      state.record,
      state.asked,
      'There are 10 to 20 meetings a week with clients and internal staff. They will be coordinating activity from the meetings, and actions.',
      'Could you estimate how regularly the assistant would need to update you or other team members about actions?',
    );
    expect(state.assistantMessage).not.toMatch(FREQUENCY);
    const recommendation = recommendRole(state.record);
    expect(recommendation?.role).toBe('Project Support');
    expect(recommendation?.responsibilities.join(' ')).toMatch(/ten active client accounts/i);
    expect(recommendation?.responsibilities.join(' ')).toMatch(/Asana as the project system/);
    expect(recommendation?.responsibilities.join(' ')).toMatch(/Coordinating project meetings/);
    expect(recommendation?.workloadStatement).toMatch(/limit of the current workload methodology/i);
    expect(recommendation?.workloadStatement).toMatch(/not a complete assessed workload|no weekly range has been calculated/i);
    expect(recommendation?.workloadStatement).not.toMatch(/outstanding work|failed to provide|still need you/i);
    expect(clientResult(state.record)?.status).toMatch(/leading recommendation/i);
    expect(clientResult(state.record)?.status).toMatch(/partial workload reading, not a complete weekly requirement/i);
    expect(state.record.workload.assessed.value).toBeNull();
    expect(state.record.workload.assessment?.complete).not.toBe(true);
  });

  it('does not ask an executive assistant for the frequency of routine chasing', () => {
    const state = reply(
      createEmptyRecord(),
      [],
      'I am a director. I need help with my inbox, my diary, correspondence, and routine chasing of actions.',
      'How often does that follow-up come up in a typical week? Would the support be keeping track of actions across several clients or projects?',
    );
    expect(recommendRole(state.record)?.role).toBe('Executive Assistant');
    expect(recommendRole(state.record)?.responsibilities).toEqual(
      expect.arrayContaining(['Inbox management', 'Diary and scheduling', 'Routine client follow-up and action tracking']),
    );
    expect(state.assistantMessage).not.toMatch(FREQUENCY);
    expect(state.record.workload.assessed.value).toBeNull();
  });

  it('does not ask operations coordination for a chasing frequency', () => {
    const state = reply(
      createEmptyRecord(),
      [],
      'We need someone to look after recurring operational workflows, supplier coordination and client onboarding. They also chase suppliers when work stalls.',
      'How often does that follow-up come up, and how regularly would they update the team about actions?',
    );
    expect(recommendRole(state.record)?.role).toBe('Operations Coordinator');
    expect(recommendRole(state.record)?.responsibilities.join(' ')).toMatch(/Supplier coordination/);
    expect(recommendRole(state.record)?.responsibilities.join(' ')).toMatch(/Client onboarding/);
    expect(state.assistantMessage).not.toMatch(FREQUENCY);
    expect(state.record.workload.assessed.value).toBeNull();
    expect(recommendRole(state.record)?.workloadStatement).toMatch(/workload methodology/i);
  });

  it('asks who a bare chase covers, and does not ask how often', () => {
    let state = reply(
      createEmptyRecord(),
      [],
      'I need an Executive Assistant for my inbox, and they would chase actions.',
      'How often does that follow-up come up in a typical week?',
    );
    expect(recommendRole(state.record)?.role).toBe('Executive Assistant');
    expect(state.assistantMessage).not.toMatch(/how often|how regularly/i);
    expect(state.record.workload.assessed.value).toBeNull();

    state = reply(
      state.record,
      state.asked,
      'About 30 emails a day. She filters them and flags what I need to see.',
      'How regularly would she update the team about those actions?',
    );
    expect(state.assistantMessage).toMatch(/across several clients or projects/i);
    expect(state.assistantMessage).not.toMatch(/how often|how regularly/i);
    expect(state.record.workload.assessed.value).toBeNull();
  });
});
