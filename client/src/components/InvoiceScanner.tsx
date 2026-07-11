import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Scan, Loader2, AlertTriangle, XCircle, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── types ─────────────────────────────────────────────────────────────────────

interface LineItem {
  description: string;
  quantity: number | null;
  unitPrice: number | null;
  total: number | null;
}

interface Extraction {
  error?: string;
  vendor: string | null;
  trn: string | null;
  date: string | null;
  currency: string;
  lineItems: LineItem[];
  subtotal: number | null;
  vatAmount: number | null;
  total: number | null;
  category: string;
  warnings: string[];
}

interface ChartAccount {
  code: string;
  name: string;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function readFileAsBase64(file: File): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip the "data:image/png;base64," prefix
      const base64 = result.split(",")[1] ?? result;
      resolve({ base64, mediaType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function fmt(n: number | null | undefined, currency = "AED") {
  if (n == null) return "—";
  return `${currency} ${Number(n).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── component ─────────────────────────────────────────────────────────────────

interface Props {
  onOpenManualForm?: () => void;
}

export default function InvoiceScanner({ onOpenManualForm }: Props) {
  const { language, direction } = useLanguage();
  const { user, company } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAr = language === "ar";
  const T = {
    scanBtn: isAr ? "مسح الفاتورة" : "Scan Invoice",
    reading: isAr ? "جاري قراءة الفاتورة…" : "Reading invoice…",
    reviewTitle: isAr ? "مراجعة الفاتورة المستخرجة" : "Review Extracted Invoice",
    save: isAr ? "حفظ في الدفاتر" : "Save to books",
    cancel: isAr ? "إلغاء" : "Cancel",
    vendor: isAr ? "المورد" : "Vendor",
    trn: isAr ? "الرقم الضريبي (TRN)" : "TRN",
    date: isAr ? "التاريخ" : "Date",
    currency: isAr ? "العملة" : "Currency",
    category: isAr ? "الفئة" : "Category",
    subtotal: isAr ? "المجموع الجزئي" : "Subtotal",
    vatAmount: isAr ? "ضريبة القيمة المضافة" : "VAT Amount",
    total: isAr ? "الإجمالي" : "Total",
    lineItems: isAr ? "بنود الفاتورة" : "Line Items",
    description: isAr ? "الوصف" : "Description",
    qty: isAr ? "الكمية" : "Qty",
    unit: isAr ? "سعر الوحدة" : "Unit Price",
    lineTotal: isAr ? "الإجمالي" : "Total",
    addLine: isAr ? "إضافة بند" : "Add line",
    notInvoice: isAr
      ? "لا يبدو أن هذا فاتورة. الرجاء تحميل صورة فاتورة أو إيصال."
      : "This doesn't look like an invoice. Please upload an invoice or receipt image.",
    aiUnavailable: isAr
      ? "التقاط الفواتير بالذكاء الاصطناعي غير متاح مؤقتًا."
      : "AI invoice capture is temporarily unavailable.",
    enterManually: isAr ? "إدخال يدوي" : "Enter manually",
    saving: isAr ? "جاري الحفظ…" : "Saving…",
    saved: isAr ? "تم الحفظ بنجاح في الدفاتر" : "Saved successfully to your books",
    selectCategory: isAr ? "اختر الفئة" : "Select category",
  };

  // state machine: idle | scanning | review | not_invoice | ai_unavailable
  const [stage, setStage] = useState<"idle" | "scanning" | "review" | "not_invoice" | "ai_unavailable">("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [fallbackMsg, setFallbackMsg] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  // editable review fields
  const [vendor, setVendor] = useState("");
  const [trn, setTrn] = useState("");
  const [date, setDate] = useState("");
  const [currency, setCurrency] = useState("AED");
  const [categoryVal, setCategoryVal] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [vatAmount, setVatAmount] = useState("");
  const [total, setTotal] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // chart of accounts for category dropdown
  const { data: chartOfAccounts = [] } = useQuery<ChartAccount[]>({
    queryKey: ["/api/chart-of-accounts"],
  });

  // save mutation — same payload shape as manual TransactionForm
  const saveMutation = useMutation({
    mutationFn: async () => {
      const totalNum = parseFloat(total) || 0;
      const vatNum = parseFloat(vatAmount) || 0;
      // Matches the manual form: new Date(dateString).toISOString()
      const txDate = date ? new Date(date).toISOString() : new Date().toISOString();
      const descriptionParts = [
        vendor || "Invoice",
        trn ? `TRN: ${trn}` : null,
        lineItems.length
          ? lineItems.map((li) => li.description).filter(Boolean).join(", ")
          : null,
      ].filter(Boolean);

      const res = await apiRequest("POST", "/api/transactions", {
        companyId: company?.id,            // required — NOT NULL
        type: "EXPENSE",
        category: categoryVal || "Office Supplies",
        description: descriptionParts.join(" | ") || "Scanned invoice",
        amount: totalNum.toFixed(2),
        vatAmount: vatNum.toFixed(2),
        transactionDate: txDate,
        status: "PROCESSED",
        createdBy: user?.id,               // required — NOT NULL
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({ title: T.saved });
      handleClose();
    },
    onError: (err: Error) => {
      // Parse server message out of "400: {\"message\":\"...\",\"error\":\"...\"}"
      let msg = err.message;
      try {
        const jsonStart = msg.indexOf("{");
        if (jsonStart !== -1) {
          const parsed = JSON.parse(msg.slice(jsonStart));
          msg = parsed.error || parsed.message || msg;
        }
      } catch {}
      setSaveError(msg);
    },
  });

  function handleClose() {
    setStage("idle");
    setPreviewUrl(null);
    setExtraction(null);
    setFallbackMsg("");
    setSaveError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function populateReviewFields(ext: Extraction) {
    setVendor(ext.vendor ?? "");
    setTrn(ext.trn ?? "");
    setDate(ext.date ?? "");
    setCurrency(ext.currency ?? "AED");
    // match extracted category to a chart of accounts name
    const matchedAccount = chartOfAccounts.find(
      (a) => a.name.toLowerCase() === ext.category?.toLowerCase()
    );
    setCategoryVal(matchedAccount ? `${matchedAccount.code}|${matchedAccount.name}` : ext.category ?? "");
    setSubtotal(ext.subtotal != null ? String(ext.subtotal) : "");
    setVatAmount(ext.vatAmount != null ? String(ext.vatAmount) : "");
    setTotal(ext.total != null ? String(ext.total) : "");
    setLineItems(ext.lineItems ?? []);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // show preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setStage("scanning");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);

    try {
      const { base64, mediaType } = await readFileAsBase64(file);
      const res = await apiRequest("POST", "/api/ai/extract-invoice", {
        fileBase64: base64,
        mediaType,
      });
      clearTimeout(timeoutId);
      const data = await res.json();

      if (!data.aiAvailable) {
        setFallbackMsg(isAr ? data.fallback?.ar : data.fallback?.en);
        setStage("ai_unavailable");
        return;
      }

      const ext: Extraction = data.extraction;
      if (ext?.error === "not_an_invoice") {
        setStage("not_invoice");
        return;
      }

      setExtraction(ext);
      populateReviewFields(ext);
      setStage("review");
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isTimeout = err?.name === "AbortError";
      setFallbackMsg(
        isTimeout
          ? (isAr ? "انتهت مهلة المعالجة. يرجى المحاولة مرة أخرى أو الإدخال يدويًا." : "Request timed out. Please try again or enter manually.")
          : T.aiUnavailable
      );
      setStage("ai_unavailable");
    }
  }

  // line item helpers
  function updateLineItem(index: number, field: keyof LineItem, value: string) {
    setLineItems((prev) =>
      prev.map((li, i) =>
        i === index
          ? { ...li, [field]: field === "description" ? value : value === "" ? null : Number(value) }
          : li
      )
    );
  }
  function addLineItem() {
    setLineItems((prev) => [...prev, { description: "", quantity: null, unitPrice: null, total: null }]);
  }
  function removeLineItem(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  const isOpen = stage !== "idle";

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Trigger button */}
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2"
      >
        <Scan className="h-4 w-4" />
        {T.scanBtn}
      </Button>

      {/* ── Scanning / Not-invoice / AI-unavailable dialog ── */}
      <Dialog open={isOpen && stage !== "review"} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-md" dir={direction}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {stage === "scanning" && <><Loader2 className="h-5 w-5 animate-spin" /> {T.reading}</>}
              {stage === "not_invoice" && <><XCircle className="h-5 w-5 text-destructive" /> {isAr ? "ليست فاتورة" : "Not an invoice"}</>}
              {stage === "ai_unavailable" && <><AlertTriangle className="h-5 w-5 text-amber-500" /> {isAr ? "غير متاح" : "Unavailable"}</>}
            </DialogTitle>
          </DialogHeader>

          {/* Preview image */}
          {previewUrl && stage === "scanning" && (
            <div className="flex justify-center">
              <img src={previewUrl} alt="invoice preview" className="max-h-48 rounded border object-contain" />
            </div>
          )}

          {stage === "not_invoice" && (
            <p className="text-sm text-muted-foreground">{T.notInvoice}</p>
          )}

          {stage === "ai_unavailable" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{fallbackMsg || T.aiUnavailable}</p>
              {onOpenManualForm && (
                <Button
                  variant="outline"
                  onClick={() => { handleClose(); onOpenManualForm(); }}
                  className="w-full"
                >
                  {T.enterManually}
                </Button>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={handleClose}>{T.cancel}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Review dialog ── */}
      <Dialog open={stage === "review"} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={direction}>
          <DialogHeader>
            <DialogTitle>{T.reviewTitle}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Warnings */}
            {extraction?.warnings && extraction.warnings.length > 0 && (
              <div className="space-y-1">
                {extraction.warnings.map((w, i) => (
                  <Alert key={i} className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">{w}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* Preview thumbnail */}
            {previewUrl && (
              <div className="flex justify-center">
                <img src={previewUrl} alt="invoice" className="max-h-32 rounded border object-contain" />
              </div>
            )}

            {/* Core fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>{T.vendor}</Label>
                <Input value={vendor} onChange={(e) => setVendor(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{T.trn}</Label>
                <Input value={trn} onChange={(e) => setTrn(e.target.value)} placeholder="100123456700001" />
              </div>
              <div className="space-y-1">
                <Label>{T.date}</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{T.currency}</Label>
                <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <Label>{T.category}</Label>
              <Select value={categoryVal} onValueChange={setCategoryVal}>
                <SelectTrigger>
                  <SelectValue placeholder={T.selectCategory} />
                </SelectTrigger>
                <SelectContent>
                  {chartOfAccounts.length > 0
                    ? chartOfAccounts.map((a) => (
                        <SelectItem key={a.code} value={`${a.code}|${a.name}`}>
                          {a.code} — {a.name}
                        </SelectItem>
                      ))
                    : (
                        // Fallback: use extracted category as single option
                        <SelectItem value={categoryVal || "Office Supplies"}>
                          {categoryVal || "Office Supplies"}
                        </SelectItem>
                      )}
                </SelectContent>
              </Select>
            </div>

            {/* Line items */}
            <div className="space-y-2">
              <Label>{T.lineItems}</Label>
              <div className="border rounded-md divide-y">
                {lineItems.map((li, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-1 p-2 items-center">
                    <Input
                      className="col-span-5 text-sm h-8"
                      placeholder={T.description}
                      value={li.description}
                      onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                    />
                    <Input
                      className="col-span-2 text-sm h-8"
                      type="number"
                      placeholder={T.qty}
                      value={li.quantity ?? ""}
                      onChange={(e) => updateLineItem(idx, "quantity", e.target.value)}
                    />
                    <Input
                      className="col-span-2 text-sm h-8"
                      type="number"
                      placeholder={T.unit}
                      value={li.unitPrice ?? ""}
                      onChange={(e) => updateLineItem(idx, "unitPrice", e.target.value)}
                    />
                    <Input
                      className="col-span-2 text-sm h-8"
                      type="number"
                      placeholder={T.lineTotal}
                      value={li.total ?? ""}
                      onChange={(e) => updateLineItem(idx, "total", e.target.value)}
                    />
                    <button
                      onClick={() => removeLineItem(idx)}
                      className="col-span-1 flex justify-center text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" onClick={addLineItem} className="flex items-center gap-1 text-xs">
                <Plus className="h-3 w-3" /> {T.addLine}
              </Button>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>{T.subtotal}</Label>
                <Input type="number" step="0.01" value={subtotal} onChange={(e) => setSubtotal(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-1">
                <Label>{T.vatAmount} (5%)</Label>
                <Input type="number" step="0.01" value={vatAmount} onChange={(e) => setVatAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-1">
                <Label className="font-semibold">{T.total}</Label>
                <Input type="number" step="0.01" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="0.00" className="font-semibold" />
              </div>
            </div>
          </div>

          {saveError && (
            <Alert className="border-red-300 bg-red-50 dark:bg-red-950/20 mt-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-700 dark:text-red-400 text-sm">{saveError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} disabled={saveMutation.isPending}>
              {T.cancel}
            </Button>
            <Button onClick={() => { setSaveError(null); saveMutation.mutate(); }} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />{T.saving}</>
              ) : T.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
