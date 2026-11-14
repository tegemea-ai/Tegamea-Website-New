const STORAGE_KEY = 'tegemea-assessment-opening';

export type AssessmentLocationState = {
  openingNote?: string;
};

/** Keep the opening note for this tab only. An empty note clears any earlier one. */
export function saveOpeningNote(note: string): void {
  const trimmed = note.trim();
  try {
    if (trimmed) sessionStorage.setItem(STORAGE_KEY, trimmed);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be blocked. Navigation state still carries this visit's note.
  }
}

export function readOpeningNote(): string {
  try {
    return sessionStorage.getItem(STORAGE_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

export function openingNoteFromState(state: unknown): string | null {
  if (!state || typeof state !== 'object' || !('openingNote' in state)) return null;
  const value = (state as AssessmentLocationState).openingNote;
  return typeof value === 'string' ? value.trim() : null;
}
