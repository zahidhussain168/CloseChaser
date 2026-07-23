import "server-only";

/**
 * AI "close analyst": reads one client's month-end situation and returns a crisp
 * read plus one concrete next step for the bookkeeper. Reuses the OpenRouter
 * (OpenAI-compatible) setup; gated on OPENROUTER_API_KEY.
 */

const DEFAULT_MODEL = "google/gemini-2.5-flash-lite";

export function isAiConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

function sanitize(s: string): string {
  const cls = "[" + String.fromCharCode(0x2014, 0x2013) + "]";
  return s
    .replace(new RegExp("\\s*" + cls + "\\s*", "g"), ", ")
    .replace(new RegExp(cls, "g"), "-")
    .trim();
}

export type InsightAction =
  | { kind: "chase"; label: string }
  | { kind: "review"; label: string }
  | { kind: "add_item"; label: string; title: string; note?: string; itemType: "document" | "questionnaire" }
  | { kind: "none" };

export type ClientInsight = {
  headline: string;
  insights: string[];
  recommendation: string;
  action: InsightAction;
};

export type InsightContext = {
  clientName: string;
  month: string;
  total: number;
  open: number;
  answered: number;
  accepted: number;
  chasing: boolean;
  daysChasing: number | null;
  remindersSent: number;
  opened: boolean;
  lastOpenedDaysAgo: number | null;
  openItems: { type: string; title: string }[];
};

const SYSTEM = `You are a sharp, practical assistant for a solo bookkeeper using RuledOff, a tool that chases the bookkeeper's own clients for the documents and answers needed to close the books each month. The client answers via a no-login link and never creates an account. You read one client's month-end situation and give the bookkeeper a crisp read plus one concrete next step. Output ONLY valid JSON, no markdown, no code fences.`;

function buildPrompt(ctx: InsightContext): string {
  const items = ctx.openItems.map((i) => `- ${i.title} (${i.type})`).join("\n") || "(none open)";
  return `Client: ${ctx.clientName}. Month: ${ctx.month}.
Items: ${ctx.total} total, ${ctx.open} still open, ${ctx.answered} answered and waiting for the bookkeeper to accept, ${ctx.accepted} ruled off.
Chase status: ${ctx.chasing ? `chasing for ${ctx.daysChasing ?? "?"} days, ${ctx.remindersSent} reminders sent` : "not chasing yet"}.
Client link: ${ctx.opened ? `opened ${ctx.lastOpenedDaysAgo ?? 0} days ago` : "not opened yet"}.
Open items:
${items}

Give the bookkeeper:
- "headline": a punchy 6 to 10 word status read.
- "insights": 2 or 3 short observations (max 14 words each) about what is happening and why it may be stuck.
- "recommendation": ONE specific next action to take now, one short sentence.
- "action": a structured one-click action that matches your recommendation, ONE of:
  {"kind":"chase","label":"Re-send the chase"} when a nudge or reminder is the move;
  {"kind":"review","label":"Rule off answered items"} when items are answered and waiting for the bookkeeper;
  {"kind":"add_item","label":"Add this to the checklist","itemType":"document" or "questionnaire","title":"<short client-facing title>","note":"<one plain-language sentence the client will read>"} when the client needs a clarifying request or a plain-language note (for example explaining what a W-9 is);
  {"kind":"none"} when no in-app action fits.

Be concrete and reference the actual items or behavior. Never use em dashes or en dashes. Plain, human language.

Output EXACTLY this JSON shape and nothing else:
{"headline":"","insights":["",""],"recommendation":"","action":{"kind":"none"}}`;
}

function normalizeAction(a: unknown): InsightAction {
  const o = (a ?? {}) as Record<string, unknown>;
  const label = typeof o.label === "string" ? sanitize(o.label) : "";
  if (o.kind === "chase") return { kind: "chase", label: label || "Re-send the chase" };
  if (o.kind === "review") return { kind: "review", label: label || "Rule off answered items" };
  if (o.kind === "add_item" && typeof o.title === "string" && o.title.trim()) {
    return {
      kind: "add_item",
      label: label || "Add this to the checklist",
      title: sanitize(o.title).slice(0, 120),
      note: typeof o.note === "string" && o.note.trim() ? sanitize(o.note).slice(0, 500) : undefined,
      itemType: o.itemType === "questionnaire" ? "questionnaire" : "document",
    };
  }
  return { kind: "none" };
}

async function callInsight(ctx: InsightContext, key: string): Promise<ClientInsight> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json", "X-Title": "RuledOff" },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
      max_tokens: 600,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: buildPrompt(ctx) },
      ],
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`AI request failed (${res.status})`);

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = json.choices?.[0]?.message?.content ?? "";
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("The AI did not return a usable read.");

  const parsed = JSON.parse(text.slice(start, end + 1)) as {
    headline?: string;
    insights?: string[];
    recommendation?: string;
    action?: unknown;
  };

  return {
    headline: sanitize(parsed.headline ?? "Here is where things stand."),
    insights: (parsed.insights ?? []).slice(0, 3).map(sanitize).filter(Boolean),
    recommendation: sanitize(parsed.recommendation ?? "Review the open items and send a nudge."),
    action: normalizeAction(parsed.action),
  };
}

export async function generateClientInsight(ctx: InsightContext): Promise<ClientInsight> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("AI is not configured yet.");
  // One retry: json_object mode is reliable, but the odd malformed response
  // should not surface to the bookkeeper as an error.
  try {
    return await callInsight(ctx, key);
  } catch {
    return await callInsight(ctx, key);
  }
}
