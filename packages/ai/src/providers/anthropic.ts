// ============================================================
// CG 160 — Anthropic (Claude) Provider
// Thin wrapper around the Anthropic SDK for use within CG 160.
// ============================================================

import Anthropic from '@anthropic-ai/sdk';

let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

export interface ClaudeTextOptions {
  model?: string;
  max_tokens?: number;
  temperature?: number;
  system?: string;
}

/**
 * Call Claude and return the text response.
 * This is the primary interface for all LLM calls in CG 160.
 */
export async function callClaude(
  prompt: string,
  options: ClaudeTextOptions = {}
): Promise<string> {
  const client = getAnthropicClient();

  const {
    model = 'claude-sonnet-4-6',
    max_tokens = 4096,
    temperature = 0.8,
    system,
  } = options;

  const response = await client.messages.create({
    model,
    max_tokens,
    ...(system ? { system } : {}),
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  return textBlock.text;
}

/**
 * Call Claude with a lower temperature for more deterministic outputs
 * (e.g., scoring, analysis tasks).
 */
export async function callClaudeAnalytical(
  prompt: string,
  options: Omit<ClaudeTextOptions, 'temperature'> = {}
): Promise<string> {
  return callClaude(prompt, { ...options, temperature: 0.2 });
}
