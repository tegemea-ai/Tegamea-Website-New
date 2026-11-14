import OpenAI from 'openai';
import { applyModelTurn, classifyFailure, coerceModelTurn, MAX_BODY_CHARS, parseTurnRequest, type TurnRequest } from '../../assessment/applyTurn';
import { ASSESSMENT_INSTRUCTIONS, buildAssessmentInput } from '../../assessment/instructions';
import { createWindowCounter, createWindowLimiter } from '../../assessment/throttle';
import { ASSESSMENT_TURN_SCHEMA } from '../../assessment/turnSchema';

const perCaller = createWindowLimiter(numberEnv('ASSESSMENT_RATE_LIMIT', 20), 10 * 60 * 1000);
const hourlyCalls = createWindowCounter(numberEnv('ASSESSMENT_HOURLY_CALL_CAP', 150), 60 * 60 * 1000);

type ModelCaller = (request: TurnRequest, apiKey: string) => Promise<unknown>;

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

export default function handler(request: Request): Promise<Response> {
  return handleAssessmentRequest(request);
}

export async function handleAssessmentRequest(request: Request, callModel: ModelCaller = callOpenAI): Promise<Response> {
  if (request.method !== 'POST') {
    return respond({ ok: false, error: 'invalid', message: 'Send a written reply to continue.' }, 405);
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARS) {
    return respond({ ok: false, error: 'too_large', message: 'That reply is too long to send.' }, 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return respond({ ok: false, error: 'invalid', message: 'Send a written reply to continue.' }, 400);
  }

  const parsed = parseTurnRequest(body);
  if (!parsed.ok) {
    return respond({ ok: false, error: parsed.error, message: parsed.message }, parsed.error === 'too_large' ? 413 : 400);
  }

  const caller = request.headers.get('x-nf-client-connection-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!perCaller(caller) || !hourlyCalls()) {
    return respond(
      {
        ok: false,
        error: 'rate_limited',
        message: 'The assessment is busy at the moment. Wait a little, then try again. Your reply is saved.',
      },
      429,
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return respond(
      { ok: false, error: 'unavailable', message: "I couldn't continue just now. Your reply is still here, so you can try again." },
      503,
    );
  }

  try {
    const modelOutput = coerceModelTurn(await callModel(parsed.value, apiKey));
    const latest = parsed.value.messages[parsed.value.messages.length - 1].text;
    const applied = applyModelTurn(parsed.value.record, latest, modelOutput, parsed.value.asked);
    return respond({ ok: true, ...applied });
  } catch (error) {
    const failure = classifyFailure(error);
    console.error('assessment-turn failed', { status: failure.status });
    return respond({ ok: false, error: failure.error, message: failure.message }, failure.status);
  }
}

async function callOpenAI(request: TurnRequest, apiKey: string): Promise<unknown> {
  const client = new OpenAI({
    apiKey,
    timeout: numberEnv('OPENAI_REQUEST_TIMEOUT_MS', 20000),
    maxRetries: 0,
  });
  const response = await client.responses.create({
    model: process.env.OPENAI_ASSESSMENT_MODEL || 'gpt-4.1-mini',
    instructions: ASSESSMENT_INSTRUCTIONS,
    input: buildAssessmentInput(request),
    max_output_tokens: numberEnv('OPENAI_MAX_OUTPUT_TOKENS', 700),
    store: false,
    text: {
      format: {
        type: 'json_schema',
        name: 'assessment_turn',
        strict: true,
        schema: ASSESSMENT_TURN_SCHEMA,
      },
    },
  });
  if (response.status === 'incomplete' || response.error) {
    throw Object.assign(new Error('incomplete assessment response'), { status: 503 });
  }
  const output = response.output_text?.trim();
  if (!output) throw Object.assign(new Error('empty assessment response'), { status: 503 });
  return JSON.parse(output);
}

function respond(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function numberEnv(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
