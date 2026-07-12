import fs from "fs";
import path from "path";
import type { Express, Request, Response } from "express";
import { AI_CONFIG } from "./config";
import { aiChat, aiExtractJSON, aiIsConfigured, type ChatMessage } from "./provider";
import { storage } from "../storage";

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
Rules: never invent values — use null when not readable. Numbers as plain numbers. Dates on UAE invoices are DD/MM/YYYY unless clearly stated otherwise — 15/06/2026 means 2026-06-15. If the document is not an invoice/receipt, return {"error": "not_an_invoice"}.`;

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

  // ── Chart of accounts lookup (matches seeded data) ────────────────────────
  const COA = [
    { code: "6001", name: "Office Supplies" },
    { code: "6002", name: "Utilities" },
    { code: "6003", name: "Bank Fees" },
    { code: "6004", name: "Residential Rent" },
    { code: "6005", name: "Entertainment & Hospitality" },
    { code: "6006", name: "Motor Vehicle (private availability)" },
    { code: "6007", name: "Statutory Fines & Penalties" },
    { code: "6008", name: "Charitable Donation (non-approved)" },
    { code: "6009", name: "Qualifying Expense (QFZP)" },
    { code: "6010", name: "Non-qualifying Expense (QFZP)" },
  ];
  const COA_LABELS = COA.map((c) => `${c.code}|${c.name}`).join(", ");

  app.post("/api/ai/classify-transaction", async (req: Request, res: Response) => {
    const { description, amount, type, vendor, date, vatAmount, companyId: rawCompanyId } = req.body ?? {};

    if (!description || amount == null || !type) {
      return res.status(400).json({ error: "description, amount, and type are required" });
    }

    const companyId = parseInt(rawCompanyId) || 1;
    const amountNum = parseFloat(amount) || 0;
    const vatNum = parseFloat(vatAmount) || 0;

    // ── Deterministic flags ──────────────────────────────────────────────────
    type Flag = { code: string; severity: "info" | "warning"; messageEn: string; messageAr: string };
    const flags: Flag[] = [];

    try {
      const allExpenses = await storage.getTransactions(companyId, { type });
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recent = allExpenses.filter(
        (t) => t.transactionDate && new Date(t.transactionDate) >= thirtyDaysAgo
      );

      // 1. Possible duplicate: same amount (within 1%) + similar description or vendor within 30 days
      const descKey = description.toLowerCase().slice(0, 25);
      const vendorKey = (vendor || "").toLowerCase().slice(0, 15);
      const dup = recent.find((t) => {
        const tAmt = parseFloat(String(t.amount) || "0");
        if (Math.abs(tAmt - amountNum) / Math.max(amountNum, 0.01) > 0.01) return false;
        const tDesc = (t.description || "").toLowerCase();
        return (
          (descKey.length > 5 && tDesc.includes(descKey)) ||
          (vendorKey.length > 3 && tDesc.includes(vendorKey))
        );
      });
      if (dup) {
        const dupDate = new Date(dup.transactionDate).toLocaleDateString("en-AE");
        flags.push({
          code: "possible-duplicate",
          severity: "warning",
          messageEn: `Possible duplicate of a ${type.toLowerCase()} from ${dupDate} for AED ${parseFloat(String(dup.amount)).toFixed(2)}.`,
          messageAr: `معاملة محتملة مكررة من ${dupDate} بمبلغ ${parseFloat(String(dup.amount)).toFixed(2)} درهم.`,
        });
      }

      // 2. VAT mismatch: vatAmount present but not ~5% of net (>1% tolerance)
      if (vatNum > 0 && amountNum > 0) {
        const expectedVat = amountNum * 0.05;
        if (Math.abs(vatNum - expectedVat) / Math.max(amountNum, 0.01) > 0.01) {
          flags.push({
            code: "vat-mismatch",
            severity: "warning",
            messageEn: `VAT (AED ${vatNum.toFixed(2)}) is not ~5% of net AED ${amountNum.toFixed(2)}. Expected ~AED ${expectedVat.toFixed(2)}.`,
            messageAr: `ضريبة القيمة المضافة (${vatNum.toFixed(2)} درهم) لا تساوي ~5% من الصافي (${amountNum.toFixed(2)} درهم). المتوقع ~${expectedVat.toFixed(2)} درهم.`,
          });
        }
      }

      // 3. Unusually large: amount > 5× company average expense (for EXPENSE type)
      if (type === "EXPENSE" && allExpenses.length > 0) {
        const avg = allExpenses.reduce((s, t) => s + parseFloat(String(t.amount) || "0"), 0) / allExpenses.length;
        if (avg > 0 && amountNum > avg * 5) {
          flags.push({
            code: "unusually-large",
            severity: "info",
            messageEn: `AED ${amountNum.toFixed(2)} is more than 5× your average expense (AED ${avg.toFixed(2)}).`,
            messageAr: `${amountNum.toFixed(2)} درهم أكثر من 5 أضعاف متوسط مصروفاتك (${avg.toFixed(2)} درهم).`,
          });
        }
      }
    } catch (err) {
      console.error("Classify deterministic check failed:", (err as Error).message);
    }

    // ── AI category suggestion ────────────────────────────────────────────────
    const aiPrompt = `Classify this ${type} transaction for a UAE SME:
Description: ${description}
Amount: AED ${amountNum}${vendor ? `\nVendor: ${vendor}` : ""}${vatNum ? `\nVAT: AED ${vatNum}` : ""}

Return JSON:
{
  "category": string (EXACT CODE|Name from list, or null),
  "confidence": "high"|"medium"|"low",
  "sectorFlag": string|null (one short English sentence if unusual for UAE SME, else null)
}
Available categories: ${COA_LABELS}`;

    try {
      const ai = await aiExtractJSON({
        system: `You are a UAE accounting assistant. Classify transactions into the given chart of accounts. Always pick the single best matching category. High confidence = obvious match. Return valid JSON only.`,
        messages: [{ role: "user", content: aiPrompt }],
      });

      if (ai.sectorFlag) {
        flags.push({
          code: "sector-unusual",
          severity: "info",
          messageEn: ai.sectorFlag,
          messageAr: ai.sectorFlag,
        });
      }

      // Validate the returned category is in our list
      const validCategory = COA.find((c) => `${c.code}|${c.name}` === ai.category)
        ? ai.category
        : null;

      res.json({
        aiAvailable: true,
        suggestion: {
          category: validCategory,
          confidence: (["high", "medium", "low"].includes(ai.confidence) ? ai.confidence : "low") as "high" | "medium" | "low",
          flags,
        },
      });
    } catch (err) {
      console.error("AI classify failed:", (err as Error).message);
      // Fail-soft: return deterministic flags only
      res.json({
        aiAvailable: false,
        suggestion: { category: null, confidence: "low" as const, flags },
      });
    }
  });
}
