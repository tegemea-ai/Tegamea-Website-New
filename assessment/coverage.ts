import type { AssessmentRecord, ProgressStage, ReviewSection, TopicId } from './types';
import { calculatedWeeklyDetail, statedWorkingTimeDetail } from './workingTime';

export const PROGRESS_LABEL: Record<ProgressStage, string> = {
  business: 'Understanding your business',
  workload: 'Exploring your workload',
  availability: 'Understanding availability and preferences',
  preferences: 'Understanding availability and preferences',
  review: 'Reviewing your requirements',
};

const QUESTION_STAGE: Record<string, ProgressStage> = {
  business: 'business',
  support: 'business',
  workload: 'workload',
  schedule: 'workload',
  availability: 'availability',
  staffing: 'preferences',
  process: 'review',
  close: 'review',
};

export function stageForQuestion(questionId: string | null, complete: boolean): ProgressStage {
  if (complete || !questionId) return 'review';
  return QUESTION_STAGE[questionId] ?? 'review';
}

export function hasBusinessNarrative(record: AssessmentRecord): boolean {
  return record.statements.some((statement) => statement.topic === 'business');
}

export function hasSupportSignal(record: AssessmentRecord): boolean {
  return record.executive.mentioned || record.project.mentioned || record.operations.mentioned;
}

export function hasProcessAnswer(record: AssessmentRecord): boolean {
  return Boolean(record.process.manualWork.value || record.process.automation.value);
}

/** Next useful question. A question is asked again only when a correction leaves an essential gap. */
export function nextQuestionId(record: AssessmentRecord, asked: string[]): string | null {
  const seen = new Set(asked);
  if (!hasBusinessNarrative(record) && !seen.has('business')) return 'business';
  if (record.workload.activeTime.value?.needsClarification && !seen.has('schedule')) return 'schedule';
  if (!hasSupportSignal(record) && !seen.has('support')) return 'support';
  if (!record.workload.activeTime.value && !record.workload.uncertainty.value && !seen.has('workload')) {
    return 'workload';
  }
  if (!record.availability.window.value && !seen.has('availability')) return 'availability';
  const staffingOpen = !record.staffing.model.value || !record.staffing.location.value;
  if (staffingOpen && !seen.has('staffing')) return 'staffing';
  if (!hasProcessAnswer(record) && !seen.has('process')) return 'process';
  if (!seen.has('close')) return 'close';
  return null;
}

function words(topic: TopicId, record: AssessmentRecord): string[] {
  return record.statements.filter((statement) => statement.topic === topic).map((statement) => statement.text);
}

function confirmed(label: string, detail: string | null | undefined): ReviewSection['items'] {
  if (!detail) return [];
  return [{ label, detail, kind: 'confirmed' }];
}

function workloadTimeItems(record: AssessmentRecord): ReviewSection['items'] {
  const time = record.workload.activeTime.value;
  if (!time) {
    return [
      {
        label: 'Active working time',
        detail: record.workload.uncertainty.value ?? 'Not confirmed. No working-time figure was given.',
        kind: 'unknown',
      },
    ];
  }

  const items: ReviewSection['items'] = [
    {
      label: 'Active working time',
      detail: statedWorkingTimeDetail(time, Boolean(record.workload.activeTime.revised)),
      kind: 'confirmed',
    },
  ];
  const calculated = calculatedWeeklyDetail(time);
  if (calculated) {
    items.push({ label: 'Weekly total, calculated', detail: calculated, kind: 'derived' });
  } else if (time.unit === 'day') {
    items.push({
      label: 'Weekly total',
      detail: 'Not confirmed. The number of working days was not given, so the daily figure has not been converted.',
      kind: 'unknown',
    });
  }
  return items;
}

export function buildReview(record: AssessmentRecord): ReviewSection[] {
  const businessWords = words('business', record);
  const supportWords = words('support', record);
  const sections: ReviewSection[] = [];

  sections.push({
    title: 'Business context',
    items: [
      ...businessWords.map((text) => ({ label: 'In your words', detail: text, kind: 'words' as const })),
      ...confirmed('Sector', record.business.sector.value),
      ...confirmed('Size', record.business.size.value),
      ...confirmed('How the business works', record.business.model.value),
      ...(record.business.sector.value || businessWords.length
        ? []
        : [{ label: 'Business', detail: 'Not confirmed. No description was given.', kind: 'unknown' as const }]),
    ],
  });

  sections.push({
    title: 'Executive and administrative support',
    items: record.executive.mentioned
      ? confirmed('Named responsibilities', record.executive.responsibilities.value?.join(', '))
      : [{ label: 'Executive support', detail: 'Not discussed.', kind: 'unknown' }],
  });

  sections.push({
    title: 'Project support',
    items: [
      ...(record.project.mentioned
        ? confirmed('Named project work', record.project.notes.value?.join(', '))
        : [{ label: 'Project support', detail: 'Not discussed.', kind: 'unknown' as const }]),
      ...confirmed('Active projects', record.project.activeProjects.value),
    ],
  });

  sections.push({
    title: 'Operational coordination',
    items: record.operations.mentioned
      ? confirmed('Named operational work', record.operations.notes.value?.join(', '))
      : [{ label: 'Operational coordination', detail: 'Not discussed.', kind: 'unknown' }],
  });

  if (supportWords.length) {
    sections.push({
      title: 'How you described the work',
      items: supportWords.map((text) => ({ label: 'In your words', detail: text, kind: 'words' as const })),
    });
  }

  sections.push({
    title: 'Workload',
    items: [
      ...workloadTimeItems(record),
      ...confirmed('Pattern', record.workload.pattern.value),
      ...confirmed('Peaks', record.workload.peak.value),
      ...words('workload', record).map((text) => ({ label: 'In your words', detail: text, kind: 'words' as const })),
    ],
  });

  sections.push({
    title: 'Availability and coverage',
    items: [
      ...(record.availability.window.value || record.availability.workingDays.value
        ? [
            ...confirmed('When someone needs to be available', record.availability.window.value),
            ...confirmed('Working days', record.availability.workingDays.value),
          ]
        : [
            {
              label: 'Availability',
              detail: 'Not confirmed. This is separate from active working time, and it was not given.',
              kind: 'unknown' as const,
            },
          ]),
      ...confirmed('Time-sensitive work', record.availability.timeSensitive.value),
      ...confirmed('Dedicated cover', record.availability.dedicatedCover.value),
      ...confirmed('Holiday or absence cover', record.availability.holidayCover.value),
      ...words('availability', record).map((text) => ({ label: 'In your words', detail: text, kind: 'words' as const })),
    ],
  });

  const modelLabel: Record<string, string> = {
    outsourced: 'Outsourced support',
    permanent: 'Permanent recruitment',
    comparing: 'Still comparing outsourced support and hiring',
    unsure: 'Not yet decided',
  };
  const locationLabel: Record<string, string> = {
    remote: 'Remote',
    hybrid: 'Hybrid',
    'on-site': 'On site',
  };

  sections.push({
    title: 'Staffing preferences',
    items: [
      ...(record.staffing.model.value
        ? confirmed('Approach', modelLabel[record.staffing.model.value])
        : [{ label: 'Outsourced or permanent', detail: 'Not confirmed.', kind: 'unknown' as const }]),
      ...(record.staffing.location.value
        ? confirmed('Where they would work', locationLabel[record.staffing.location.value])
        : [{ label: 'Remote, hybrid or on site', detail: 'Not confirmed.', kind: 'unknown' as const }]),
      ...confirmed('Budget', record.staffing.budget.value),
      ...confirmed('Start', record.staffing.startDate.value),
      ...confirmed('Existing support', record.staffing.existingSupport.value),
      ...words('staffing', record).map((text) => ({ label: 'In your words', detail: text, kind: 'words' as const })),
    ],
  });

  sections.push({
    title: 'Process improvement',
    items: record.process.skipped
      ? [{ label: 'Process improvement', detail: 'Left unanswered. Nothing was assumed.', kind: 'skipped' }]
      : [
          ...confirmed('Systems', record.process.systems.value?.join(', ')),
          ...confirmed('Manual or duplicated work', record.process.manualWork.value),
          ...words('process', record).map((text) => ({ label: 'In your words', detail: text, kind: 'words' as const })),
          ...(record.process.systems.value || record.process.manualWork.value || words('process', record).length
            ? []
            : [{ label: 'Process improvement', detail: 'Not discussed.', kind: 'unknown' as const }]),
        ],
  });

  return sections.filter((section) => section.items.length > 0);
}
