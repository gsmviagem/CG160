// ============================================================
// CG 160 — LLM Provider aliases
// Default provider: Groq (free)
// Gemini kept as fallback for future use
// ============================================================

export { callGroq as callClaude, callGroqAnalytical as callClaudeAnalytical } from './groq';
export type { GroqTextOptions as ClaudeTextOptions } from './groq';
