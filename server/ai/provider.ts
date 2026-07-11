import Anthropic from "@anthropic-ai/sdk";
import { AI_CONFIG } from "./config";

export class AIUnavailableError extends Error {}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (client) return client;
  if (AI_CONFIG.provider !== "anthropic") {
    throw new AIUnavailableError(`Provider '${AI_CONFIG.provider}' not configured`);
  }
  if (!AI_CONFIG.anthropicApiKey) {
    throw new AIUnavailableError("ANTHROPIC_API_KEY secret is not set");
  }
  client = new Anthropic({ apiKey: AI_CONFIG.anthropicApiKey });
  return client;
}

export type ChatMessage = { role: "user" | "assistant"; content: any };

export async function aiChat(opts: {
  system: string;
  messages: ChatMessage[];
  tier?: "advisor" | "fast";
}): Promise<{ text: string }> {
  const tier = opts.tier ?? "advisor";
  const response = await getClient().messages.create({
    model: tier === "advisor" ? AI_CONFIG.advisorModel : AI_CONFIG.fastModel,
    max_tokens: tier === "advisor" ? AI_CONFIG.advisorMaxTokens : AI_CONFIG.fastMaxTokens,
    system: opts.system,
    messages: opts.messages,
  });
  const text = response.content
    .filter((b) => b.type === "text")
    .map((b: any) => b.text)
    .join("");
  return { text };
}

export function aiIsConfigured(): boolean {
  return AI_CONFIG.provider === "anthropic" && Boolean(AI_CONFIG.anthropicApiKey);
}

export async function aiExtractJSON(opts: { system: string; messages: ChatMessage[] }): Promise<any> {
  const response = await getClient().messages.create({
    model: AI_CONFIG.fastModel,
    max_tokens: AI_CONFIG.fastMaxTokens,
    system: opts.system + "\n\nRespond ONLY with valid JSON. No markdown fences, no commentary.",
    messages: opts.messages,
  });
  const raw = response.content.filter((b) => b.type === "text").map((b: any) => b.text).join("");

  // Pass 1: direct parse (model obeyed the instruction)
  try { return JSON.parse(raw.trim()); } catch {}

  // Pass 2: strip any leading/trailing markdown fences (``` or ```json)
  const stripped = raw.trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  try { return JSON.parse(stripped); } catch {}

  // Pass 3: extract the first complete JSON object or array from the text
  const match = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (match) {
    try { return JSON.parse(match[1]); } catch {}
  }

  throw new SyntaxError(`Could not parse AI response as JSON. Raw (first 200 chars): ${raw.slice(0, 200)}`);
}
