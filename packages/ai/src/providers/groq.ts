// ============================================================
// CG 160 — Groq Provider
// Free tier: 6,000 req/day, llama-3.3-70b
// ============================================================

export interface GroqTextOptions {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  system?: string;
}

// Fallback chain when a model hits rate limits
const FALLBACK_MODELS: Record<string, string[]> = {
  'llama-3.3-70b-versatile': ['llama-3.1-8b-instant', 'gemma2-9b-it'],
  'llama-3.1-8b-instant':    ['gemma2-9b-it'],
};

interface GroqRequestBody {
  model?: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  [key: string]: unknown;
}

async function groqFetch(body: GroqRequestBody): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');

  const primaryModel = body.model ?? 'llama-3.3-70b-versatile';
  const modelsToTry = [primaryModel, ...(FALLBACK_MODELS[primaryModel] ?? [])];

  let lastError = '';
  for (const model of modelsToTry) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...body, model }),
    });

    if (response.ok) {
      const data = await response.json() as {
        choices: Array<{ message: { content: string } }>;
      };
      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error('No text response from Groq');
      return text;
    }

    const errorText = await response.text();
    // Only fall back on rate limit errors (429)
    if (response.status === 429) {
      lastError = `${model} rate limited (429)`;
      continue;
    }
    // Any other error — throw immediately
    throw new Error(`Groq API error: ${response.status} ${errorText}`);
  }

  throw new Error(`All Groq models rate limited. Last error: ${lastError}. Try again later or upgrade at https://console.groq.com/settings/billing`);
}

export async function callGroq(
  prompt: string,
  options: GroqTextOptions = {}
): Promise<string> {
  const {
    model = 'llama-3.3-70b-versatile',
    temperature = 0.8,
    maxOutputTokens = 4096,
    system,
  } = options;

  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });

  return groqFetch({
    model,
    messages,
    temperature,
    max_tokens: maxOutputTokens,
  });
}

export async function callGroqAnalytical(
  prompt: string,
  options: Omit<GroqTextOptions, 'temperature'> = {}
): Promise<string> {
  return callGroq(prompt, { ...options, temperature: 0.2 });
}
