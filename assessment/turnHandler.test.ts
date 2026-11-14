import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createEmptyRecord } from './types';
import { handleAssessmentRequest } from '../netlify/functions/assessment-turn';

const key = 'test-key';

function post(body: unknown, ip = '203.0.113.20') {
  return new Request('http://localhost/.netlify/functions/assessment-turn', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
}

describe('assessment function', () => {
  it('returns a recoverable error when the model is rate limited', async () => {
    process.env.OPENAI_API_KEY = key;
    const response = await handleAssessmentRequest(
      post({
        messages: [{ role: 'visitor', text: 'The diary takes 2 hours per day.' }],
        record: createEmptyRecord(),
        asked: [],
      }, '203.0.113.21'),
      async () => {
        throw Object.assign(new Error('rate limit'), { status: 429 });
      },
    );
    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe('rate_limited');
    expect(JSON.stringify(body)).not.toContain(key);
  });

  it('keeps 2 hours per day when the model reply is applied', async () => {
    process.env.OPENAI_API_KEY = key;
    const response = await handleAssessmentRequest(
      post({
        messages: [{ role: 'visitor', text: 'The diary work takes 2 hours per day.' }],
        record: createEmptyRecord(),
        asked: [],
      }, '203.0.113.22'),
      async () => ({ assistantMessage: 'How many days a week does that apply to?' }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.record.workload.activeTime.value.unit).toBe('day');
    expect(body.record.workload.activeTime.value.weeklyHours).toBeNull();
    expect(body.assistantMessage).not.toMatch(/£/);
  });

  it('does not put the API key in the website source', () => {
    const page = readFileSync('components/assessment/AssessmentPage.tsx', 'utf8');
    const client = readFileSync('assessment/turnClient.ts', 'utf8');
    expect(page + client).not.toMatch(/OPENAI_API_KEY|sk-|from 'openai'|from \"openai\"/);
  });
});
