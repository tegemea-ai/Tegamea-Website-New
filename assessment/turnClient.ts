import type { AssessmentRecord } from './types';

export const TURN_ENDPOINT = '/.netlify/functions/assessment-turn';

export interface TurnSuccess {
  ok: true;
  assistantMessage: string;
  record: AssessmentRecord;
  asked: string[];
  pending: string | null;
  complete: boolean;
}

export interface TurnFailure {
  ok: false;
  error: 'unavailable' | 'rate_limited' | 'invalid' | 'too_large';
  message: string;
}

export type TurnResponse = TurnSuccess | TurnFailure;

export interface TurnPayload {
  messages: { role: 'assistant' | 'visitor'; text: string }[];
  record: AssessmentRecord;
  asked: string[];
}

const UNAVAILABLE: TurnFailure = {
  ok: false,
  error: 'unavailable',
  message: "I couldn't continue just now. Your reply is still here, so you can try again.",
};

export async function requestAssessmentTurn(payload: TurnPayload): Promise<TurnResponse> {
  try {
    const response = await fetch(TURN_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => null)) as TurnResponse | null;
    if (!body || typeof body !== 'object' || !('ok' in body)) return UNAVAILABLE;
    if (!body.ok) {
      return {
        ok: false,
        error: body.error || 'unavailable',
        message: body.message || UNAVAILABLE.message,
      };
    }
    if (!body.assistantMessage || !body.record) return UNAVAILABLE;
    return body;
  } catch {
    return UNAVAILABLE;
  }
}
