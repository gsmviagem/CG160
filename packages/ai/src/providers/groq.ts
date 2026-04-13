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

async function groqFetch(body: object): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} ${error}`);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
  };

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('No text response from Groq');
  return text;
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
