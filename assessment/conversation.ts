import { createEmptyRecord, type AssessmentSession } from './types';

export const WELCOME =
  "To start, could you tell me a little about your business and what's prompted you to look for operational support?";

/** A local starting point. The first interpretation happens on the server. */
export function createConversation(openingNote: string | null): AssessmentSession {
  const opening = openingNote?.trim() ?? '';
  if (!opening) {
    return {
      version: 2,
      openingNote: '',
      messages: [{ id: 'm1', role: 'assistant', text: WELCOME }],
      record: createEmptyRecord(),
      asked: [],
      pending: 'business',
      complete: false,
    };
  }

  return {
    version: 2,
    openingNote: opening,
    messages: [{ id: 'm1', role: 'visitor', text: opening }],
    record: createEmptyRecord(),
    asked: [],
    pending: 'business',
    complete: false,
  };
}
