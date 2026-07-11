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
