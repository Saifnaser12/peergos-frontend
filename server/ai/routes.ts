import fs from "fs";
import path from "path";
import type { Express, Request, Response } from "express";
import { AI_CONFIG } from "./config";
import { aiChat, aiExtractJSON, aiIsConfigured, type ChatMessage } from "./provider";

let cache = { text: "", loadedAt: 0 };
function loadKnowledge(): string {
  if (Date.now() - cache.loadedAt < AI_CONFIG.knowledgeCacheMs) return cache.text;
  let text = "";
  try {
    const files = fs.readdirSync(AI_CONFIG.knowledgeDir).filter((f) => f.endsWith(".md")).sort();
    text = files.map((f) => fs.readFileSync(path.join(AI_CONFIG.knowledgeDir, f), "utf8")).join("\n\n---\n\n");
  } catch { /* folder missing — advisor still answers, less grounded */ }
  cache = { text, loadedAt: Date.now() };
  return text;
}

function advisorSystemPrompt(): string {
  return `You are the Peergos AI Tax Advisor inside Peergos — a UAE platform helping SMEs with CIT, VAT, bookkeeping, e-invoicing and FTA filing.

LANGUAGE: reply in the user's language (Arabic or English; Urdu supported). Proper Modern Standard Arabic.
AUDIENCE: UAE SME owners, mostly not accountants. Simple language, concrete numbers, AED amounts.
GROUNDING: base answers on the knowledge below; if not covered, say so and use only well-established UAE tax rules. Never invent article numbers or penalty amounts.
BOUNDARIES: general information, NOT legal/tax advice. For complex cases (free zone qualification, disputes, penalties, restructuring) recommend an FTA-approved tax agent and mention Peergos can connect them. Never assist tax evasion. Filings always go through the user's review (human-in-the-loop).
STYLE: concise, warm, professional. End judgment-call answers with a one-line general-information reminder.

=== KNOWLEDGE BASE ===
${loadKnowledge() || "(none loaded — be extra cautious)"}
=== END ===`;
}

export function registerAiRoutes(app: Express) {
  app.get("/api/ai/status", (_req: Request, res: Response) => {
    res.json({ aiAvailable: aiIsConfigured(), provider: AI_CONFIG.provider });
  });

  app.post("/api/ai/chat", async (req: Request, res: Response) => {
    const { messages } = req.body ?? {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array required" });
    }
    const history: ChatMessage[] = messages
      .slice(-AI_CONFIG.maxHistoryMessages)
      .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m: any) => ({ role: m.role, content: m.content.slice(0, AI_CONFIG.maxMessageChars) }));
    if (!history.length || history[history.length - 1].role !== "user") {
      return res.status(400).json({ error: "last message must be from user" });
    }
    try {
      const { text } = await aiChat({ system: advisorSystemPrompt(), messages: history, tier: "advisor" });
      res.json({ aiAvailable: true, reply: text });
    } catch (err) {
      console.error("AI chat failed:", (err as Error).message);
      res.json({
        aiAvailable: false,
        reply: null,
        fallback: {
          en: "The AI assistant is temporarily unavailable. Your bookkeeping and filings are unaffected. For urgent tax questions, please consult an FTA-approved tax agent.",
          ar: "المساعد الذكي غير متاح مؤقتًا. لا يؤثر ذلك على دفاتركم أو تقديماتكم الضريبية. للأسئلة العاجلة، يُرجى استشارة وكيل ضريبي معتمد من الهيئة الاتحادية للضرائب.",
        },
      });
    }
  });

  const EXTRACT_MEDIA = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

  // Categories matching the seeded chart of accounts
  const EXPENSE_CATEGORIES = [
    "Office Supplies",
    "Utilities",
    "Bank Fees",
    "Residential Rent",
    "Entertainment & Hospitality",
    "Motor Vehicle (private availability)",
    "Statutory Fines & Penalties",
    "Charitable Donation (non-approved)",
    "Qualifying Expense (QFZP)",
    "Non-qualifying Expense (QFZP)",
  ];

  app.post("/api/ai/extract-invoice", async (req: Request, res: Response) => {
    const { fileBase64, mediaType } = req.body ?? {};
    if (typeof fileBase64 !== "string" || !EXTRACT_MEDIA.includes(mediaType)) {
      return res.status(400).json({ error: "fileBase64 and valid mediaType required" });
    }
    if (fileBase64.length > 12_000_000) {
      return res.status(400).json({ error: "file too large (max ~9MB)" });
    }

    const fileBlock =
      mediaType === "application/pdf"
        ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: fileBase64 } }
        : { type: "image", source: { type: "base64", media_type: mediaType, data: fileBase64 } };

    const system = `You extract structured data from UAE invoices and receipts (Arabic and English).
Return JSON with EXACTLY these keys:
{
  "vendor": string|null,
  "trn": string|null (15-digit UAE TRN if present),
  "date": string|null (YYYY-MM-DD),
  "currency": string (default "AED"),
  "lineItems": [{ "description": string, "quantity": number|null, "unitPrice": number|null, "total": number|null }],
  "subtotal": number|null,
  "vatAmount": number|null (UAE standard rate 5%),
  "total": number|null,
  "category": string (best match from: ${JSON.stringify(EXPENSE_CATEGORIES)}),
  "warnings": [string] (anything unclear, missing or suspicious, e.g. "VAT is not 5% of subtotal", "TRN missing")
}
Rules: never invent values — use null when not readable. Numbers as plain numbers. If the document is not an invoice/receipt, return {"error": "not_an_invoice"}.`;

    try {
      const extraction = await aiExtractJSON({
        system,
        messages: [
          {
            role: "user",
            content: [fileBlock as any, { type: "text", text: "Extract this invoice." }],
          },
        ],
      });
      res.json({ aiAvailable: true, extraction });
    } catch (err) {
      console.error("AI extract failed:", (err as Error).message);
      res.json({
        aiAvailable: false,
        extraction: null,
        fallback: {
          en: "AI invoice capture is temporarily unavailable. You can still enter this invoice manually.",
          ar: "التقاط الفواتير بالذكاء الاصطناعي غير متاح مؤقتًا. لا يزال بإمكانك إدخال الفاتورة يدويًا.",
        },
      });
    }
  });
}
