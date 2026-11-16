import { describe, expect, it } from 'vitest';
import { createEmptyRecord, explicitFact } from '../types';
import { assessWorkload } from './assess';

describe('workload reading', () => {
  it('keeps a reply-heavy inbox out of a confirmed total', () => {
    const record = createEmptyRecord();
    record.executive.responsibilities = explicitFact(['Inbox management'], 'inbox');
    record.workload.evidence = [{ id: 'e1', text: 'Inbox volume mentioned: about 120 emails. Inbox described as more than triage.' }];
    const reading = assessWorkload(record);
    expect(reading?.complete).toBe(false);
    expect(reading?.summary).toMatch(/not a complete assessed workload/i);
    expect(reading?.subtotalLowMinutes).toBeNull();
    expect(reading?.components.find((item) => item.id === 'inbox')?.status).toBe('provisional');
  });

  it('applies the inbox anchor across the days the visitor stated', () => {
    const record = createEmptyRecord();
    record.executive.responsibilities = explicitFact(['Inbox management'], 'inbox');
    record.workload.evidence = [{ id: 'e1', text: 'Inbox volume mentioned: about 100 emails. Inbox handling includes triage.' }];
    record.workload.activeTime = explicitFact(
      {
        stated: 'the stated days',
        amount: 2,
        amountTo: null,
        unit: 'day',
        unitStated: true,
        daysPerWeek: 5,
        weeklyHours: 10,
        weeklyHoursTo: null,
        needsClarification: false,
      },
      'days',
    );
    const reading = assessWorkload(record);
    expect(reading?.components.find((item) => item.id === 'inbox')).toMatchObject({ status: 'benchmark', lowMinutes: 300, highMinutes: 450, period: 'week' });
  });

  it('does not apply the inbox anchor when the handling was not described', () => {
    const record = createEmptyRecord();
    record.executive.responsibilities = explicitFact(['Inbox management'], 'inbox');
    record.workload.evidence = [{ id: 'e1', text: 'Inbox volume mentioned: about 100 emails.' }];
    const reading = assessWorkload(record);
    expect(reading?.components.find((item) => item.id === 'inbox')?.status).toBe('unquantified');
    expect(reading?.subtotalLowMinutes).toBeNull();
    expect(reading?.summary).not.toMatch(/\blight\b/i);
  });

  it('uses a stated document class and count, and does not price unnamed documents', () => {
    const record = createEmptyRecord();
    record.executive.responsibilities = explicitFact(['Document preparation'], 'documents');
    expect(assessWorkload(record)?.components.find((item) => item.id === 'documents')?.status).toBe('unquantified');
    record.workload.evidence = [{ id: 'e1', text: 'Document preparation: about 4 simple documents a week.' }];
    const reading = assessWorkload(record);
    expect(reading?.components.find((item) => item.id === 'documents')).toMatchObject({ status: 'benchmark', lowMinutes: 40, highMinutes: 80, period: 'week' });
  });

  it('does not call an inbox and scheduling subtotal complete while bookkeeping is unquantified', () => {
    const record = createEmptyRecord();
    record.executive.responsibilities = explicitFact(['Diary management', 'Client meeting coordination'], 'diary');
    record.operations.notes = explicitFact(['Invoicing and payment follow-up'], 'invoices');
    record.operations.mentioned = true;
    record.workload.evidence = [{ id: 'e1', text: 'About 12 meetings in a typical week. Coordinates external client meetings. Straightforward one-to-one.' }];
    const reading = assessWorkload(record);
    expect(reading?.complete).toBe(false);
    expect(reading?.summary).toMatch(/quantified subtotal/i);
    expect(reading?.summary).toMatch(/not a complete/i);
    expect(reading?.summary).toMatch(/invoicing and bookkeeping/i);
    expect(reading?.subtotalLowMinutes).toBe(60);
    expect(reading?.subtotalHighMinutes).toBe(120);
  });

  it('keeps a meeting range and applies the simple external rate to both ends', () => {
    const record = createEmptyRecord();
    record.executive.responsibilities = explicitFact(['Diary management'], 'diary');
    record.workload.evidence = [{ id: 'e1', text: 'About 10–15 meetings a week. Coordinates external client meetings. Straightforward one-to-one.' }];
    const reading = assessWorkload(record);
    const scheduling = reading?.components.find((item) => item.id === 'scheduling');
    expect(scheduling).toMatchObject({ status: 'benchmark', lowMinutes: 50, highMinutes: 150, period: 'week' });
    expect(scheduling?.note).toMatch(/10–15/);
    expect(scheduling?.note).toMatch(/range is kept/i);
  });

  it('uses the 15–20 minute internal total only for a single count of 12', () => {
    const exact = createEmptyRecord();
    exact.executive.responsibilities = explicitFact(['Diary management'], 'diary');
    exact.workload.evidence = [{ id: 'e1', text: 'About 12 meetings a week. Internal meetings.' }];
    expect(assessWorkload(exact)?.components.find((item) => item.id === 'scheduling')).toMatchObject({ lowMinutes: 15, highMinutes: 20 });

    const range = createEmptyRecord();
    range.executive.responsibilities = explicitFact(['Diary management'], 'diary');
    range.workload.evidence = [{ id: 'e1', text: 'About 10–15 meetings a week. Internal meetings.' }];
    const component = assessWorkload(range)?.components.find((item) => item.id === 'scheduling');
    expect(component?.status).toBe('unquantified');
    expect(component?.lowMinutes).toBeNull();
    expect(component?.note).toMatch(/10–15/);
  });

  it('does not apply the inbox anchor to a range that crosses the 80–150 band', () => {
    const record = createEmptyRecord();
    record.executive.responsibilities = explicitFact(['Inbox management'], 'inbox');
    record.workload.evidence = [{ id: 'e1', text: 'Inbox volume mentioned: about 70–160 emails. Inbox handling includes triage.' }];
    const inbox = assessWorkload(record)?.components.find((item) => item.id === 'inbox');
    expect(inbox?.status).toBe('unquantified');
    expect(inbox?.note).toMatch(/70–160/);
    expect(inbox?.note).toMatch(/not treated as a single count/i);
  });
});
