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
});
