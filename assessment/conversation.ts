import { say } from './messageFormat';
import { createEmptyRecord, type AssessmentSession } from './types';

export const OPENING_QUESTION = "Tell me a little about your business and what you'd like help with.";

/** Shown as an example of what a visitor could write. It is not an answer and it is not stored. */
export const OPENING_EXAMPLE =
  "I run a growing consultancy and I'm spending too much time managing emails, meetings and following up on work.";

export const WELCOME = say({
  question: OPENING_QUESTION,
  after: `For example, “${OPENING_EXAMPLE}”`,
});

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
