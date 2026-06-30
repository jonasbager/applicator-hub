import Anthropic from '@anthropic-ai/sdk';

// Claude Haiku 4.5: fast and cheap, ideal for extraction; supports native
// structured outputs (guaranteed-valid JSON against a schema).
export const EXTRACTION_MODEL = 'claude-haiku-4-5';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

/**
 * Run a structured extraction with Claude. Returns JSON validated against the
 * provided JSON schema (no fragile prompt-parsing / regex fallback needed).
 */
export async function extractStructured<T>(opts: {
  system: string;
  content: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
}): Promise<T> {
  const message = await getClient().messages.create({
    model: EXTRACTION_MODEL,
    max_tokens: opts.maxTokens ?? 1024,
    system: opts.system,
    messages: [{ role: 'user', content: opts.content }],
    output_config: { format: { type: 'json_schema', schema: opts.schema } },
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text content returned from Claude');
  }
  return JSON.parse(textBlock.text) as T;
}

/**
 * Map a provider/AI error to a clear user-facing message + HTTP status, so the
 * UI can tell "out of credits" apart from a generic failure.
 */
export function aiErrorResponse(error: unknown): { statusCode: number; message: string } {
  const e = error as { status?: number; error?: { type?: string }; message?: string };
  const status = e?.status;
  const type = e?.error?.type;

  if (status === 429) {
    return { statusCode: 503, message: 'The AI service is rate-limited right now. Please try again in a moment.' };
  }
  if (status === 401) {
    return { statusCode: 500, message: 'AI service authentication failed — check the ANTHROPIC_API_KEY.' };
  }
  if (type === 'billing_error' || status === 402) {
    return { statusCode: 402, message: 'The AI service is out of credits. Please top up the Anthropic account.' };
  }
  if (status === 403) {
    return { statusCode: 500, message: 'AI service access denied (permission or billing issue).' };
  }
  return { statusCode: 500, message: e?.message || 'AI processing failed.' };
}
