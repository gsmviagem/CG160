// ============================================================
// CG 160 — LLM Provider (re-exports Gemini as default)
// Kept for backwards compatibility.
// ============================================================

export { callGemini as callClaude, callGeminiAnalytical as callClaudeAnalytical } from './gemini';
export type { GeminiTextOptions as ClaudeTextOptions } from './gemini';
