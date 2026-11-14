import type { AssessmentSession } from './types';

const SESSION_KEY = 'tegemea-assessment-session';

export function loadSession(): AssessmentSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AssessmentSession;
    if (parsed?.version !== 1 || !Array.isArray(parsed.messages)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: AssessmentSession): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // The conversation still works in memory if storage is blocked.
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Nothing further to clear.
  }
}
