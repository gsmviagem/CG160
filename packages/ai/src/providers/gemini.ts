// ============================================================
// CG 160 — Google Gemini Provider
// Replaces Anthropic. Uses gemini-2.0-flash (free tier).
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai';

let _client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!_client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
    _client = new GoogleGenerativeAI(apiKey);
  }
  return _client;
}

export interface GeminiTextOptions {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  system?: string;
}

/**
 * Call Gemini and return the text response.
 * Primary interface for all LLM calls in CG 160.
 */
export async function callGemini(
  prompt: string,
  options: GeminiTextOptions = {}
): Promise<string> {
  const {
    model = 'gemini-2.0-flash',
    temperature = 0.8,
    maxOutputTokens = 4096,
    system,
  } = options;

  const client = getClient();
  const genModel = client.getGenerativeModel({
    model,
    systemInstruction: system,
    generationConfig: {
      temperature,
      maxOutputTokens,
    },
  });

  const result = await genModel.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  if (!text) throw new Error('No text response from Gemini');
  return text;
}

/**
 * Low temperature call for analytical/scoring tasks.
 */
export async function callGeminiAnalytical(
  prompt: string,
  options: Omit<GeminiTextOptions, 'temperature'> = {}
): Promise<string> {
  return callGemini(prompt, { ...options, temperature: 0.2 });
}
