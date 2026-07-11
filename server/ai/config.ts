import path from "path";

export const AI_CONFIG = {
  provider: process.env.AI_PROVIDER || "anthropic",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  advisorModel: process.env.AI_ADVISOR_MODEL || "claude-sonnet-4-5",
  fastModel: process.env.AI_FAST_MODEL || "claude-haiku-4-5",
  advisorMaxTokens: 1024,
  fastMaxTokens: 2048,
  maxHistoryMessages: 12,
  maxMessageChars: 4000,
  knowledgeDir: path.join(import.meta.dirname, "knowledge"),
  knowledgeCacheMs: 60_000,
};
