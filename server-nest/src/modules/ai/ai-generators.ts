/**
 * AI generators, a faithful port of the app's src/lib/ai. Two OpenRouter calls:
 * the chase-email ladder from a firm's voice, and a per-client "analyst" read.
 * Both output strict JSON and are sanitised for the no-dash copy rule.
 */
const DEFAULT_MODEL = "google/gemini-2.5-flash-lite";

export function isAiConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

/** No em/en dashes anywhere, per the product copy rule. Backstop the model. */
function sanitize(s: string): string {
  const cls = "[" + String.fromCharCode(0x2014, 0x2013) + "]";
  return s
    .replace(new RegExp("\\s*" + cls + "\\s*", "g"), ", ")
    .replace(new RegExp(cls, "g"), "-")
    .trim();
}

async function chat(body: object, key: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json", "X-Title": "RuledOff" },
    body: JSON.stringify({ model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL, ...body }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`AI request failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content ?? "";
}

// ── Chase-email ladder ───────────────────────────────────────────────────────

export type EmailKind = "initial" | "level1" | "level2" | "level3" | "level4";
export type GeneratedTemplate = { subject: string; body: string };
export type GeneratedSet = Record<EmailKind, GeneratedTemplate>;
const KINDS: EmailKind[] = ["initial", "level1", "level2", "level3", "level4"];

const EMAIL_SYSTEM = `You write email templates for RuledOff, a tool solo bookkeepers use to chase their own clients for the documents, receipts, and answers needed to close the books each month. You output ONLY valid JSON. No preamble, no markdown, no code fences.`;

function emailPrompt(firmName: string, voice: string, tone: string): string {
  return `Write a set of 5 chase emails for the bookkeeping firm "${firmName}".

The bookkeeper describes their voice like this:
"""
${voice || "(no description given, use the tone below)"}
"""
Overall tone: ${tone}.

Produce these 5 escalation levels, each firmer than the last but always kind and professional:
- "initial": the first request. Warm and appreciative. Explains you need a few things to close their books.
- "level1": a friendly nudge a couple of days later. Light, low pressure.
- "level2": firmer and specific, naming a soft deadline. Uses {{deadline}}.
- "level3": consequence-framed. Explain plainly that the books cannot close without these items, and that late books can mean late taxes and filings. Still helpful, not threatening.
- "level4": a brief, gentle weekly reminder.

Each email has a "subject" and a "body".

STRICT RULES:
- Use ONLY these tokens, written as literal {{token}} strings, where they read naturally: {{firstName}}, {{firmName}}, {{month}}, {{openCount}}, {{deadline}}. Do not invent other tokens.
- Do NOT include a link, a button, or a list of the items. Those are added automatically by the system. Write only the message copy.
- The client never creates an account, never logs in, never downloads anything. Never imply otherwise.
- NEVER use em dashes or en dashes. Use periods or commas instead.
- Keep each body to roughly 3 to 6 short lines. Plain, human language. No corporate jargon.
- Sign off using {{firmName}}.
- Use \\n for line breaks inside body strings.

Output EXACTLY this JSON shape and nothing else:
{"initial":{"subject":"","body":""},"level1":{"subject":"","body":""},"level2":{"subject":"","body":""},"level3":{"subject":"","body":""},"level4":{"subject":"","body":""}}`;
}

export async function generateChaseEmails(params: { firmName: string; voice: string; tone: string }): Promise<GeneratedSet> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("AI is not configured yet.");
  const text = await chat(
    {
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        { role: "system", content: EMAIL_SYSTEM },
        { role: "user", content: emailPrompt(params.firmName, params.voice, params.tone) },
      ],
    },
    key,
  );
  const start = text.indexOf("{"), end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("The AI did not return usable templates.");
  let parsed: Record<string, { subject?: string; body?: string }>;
  try {
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new Error("The AI response could not be read. Try again.");
  }
  const out = {} as GeneratedSet;
  for (const kind of KINDS) {
    const t = parsed[kind];
    if (!t?.subject || !t?.body) throw new Error(`The AI skipped the "${kind}" email. Try again.`);
    out[kind] = { subject: sanitize(t.subject), body: sanitize(t.body) };
  }
  return out;
}

// ── Per-client analyst ───────────────────────────────────────────────────────

export type InsightAction =
  | { kind: "chase"; label: string }
  | { kind: "review"; label: string }
  | { kind: "annotate"; label: string; itemTitle: string; note: string }
  | { kind: "add_item"; label: string; title: string; note?: string; itemType: "document" | "questionnaire" }
  | { kind: "none" };

export type ClientInsight = {
  headline: string;
  insights: string[];
  recommendation: string;
  action: InsightAction;
};

export type InsightContext = {
  clientName: string; month: string; total: number; open: number; answered: number;
  accepted: number; chasing: boolean; daysChasing: number | null; remindersSent: number;
  opened: boolean; lastOpenedDaysAgo: number | null; openItems: { type: string; title: string }[];
};

const INSIGHT_SYSTEM = `You are a sharp, practical assistant for a solo bookkeeper using RuledOff, a tool that chases the bookkeeper's own clients for the documents and answers needed to close the books each month. The client answers via a no-login link and never creates an account. You read one client's month-end situation and give the bookkeeper a crisp read plus one concrete next step. Output ONLY valid JSON, no markdown, no code fences.`;

function toneGuidance(remindersSent: number): string {
  if (remindersSent >= 3)
    return "Tone: this client has been nudged several times. Make the recommendation firmer and reference the mounting delay, while staying respectful and never scolding.";
  if (remindersSent >= 1) return "Tone: they have had a nudge or two. Keep it friendly but a little more direct.";
  return "Tone: early in the chase. Keep it warm and low-pressure.";
}

function insightPrompt(ctx: InsightContext): string {
  const items = ctx.openItems.map((i) => `- ${i.title} (${i.type})`).join("\n") || "(none open)";
  return `Client: ${ctx.clientName}. Month: ${ctx.month}.
Items: ${ctx.total} total, ${ctx.open} still open, ${ctx.answered} answered and waiting for the bookkeeper to accept, ${ctx.accepted} ruled off.
Chase status: ${ctx.chasing ? `chasing for ${ctx.daysChasing ?? "?"} days, ${ctx.remindersSent} reminders sent` : "not chasing yet"}.
Client link: ${ctx.opened ? `opened ${ctx.lastOpenedDaysAgo ?? 0} days ago` : "not opened yet"}.
${toneGuidance(ctx.remindersSent)}
Open items:
${items}

Give the bookkeeper:
- "headline": a punchy 6 to 10 word status read.
- "insights": 2 or 3 short observations (max 14 words each) about what is happening and why it may be stuck.
- "recommendation": ONE specific next action to take now, one short sentence.
- "action": a structured one-click action that matches your recommendation, ONE of:
  {"kind":"chase","label":"Re-send the chase"} when a nudge or reminder is the move;
  {"kind":"review","label":"Rule off answered items"} when items are answered and waiting for the bookkeeper;
  {"kind":"annotate","label":"Add a note for the client","itemTitle":"<the EXACT title of an item from the open items list above>","note":"<one plain-language sentence the client will read>"} when clarifying an item ALREADY on the checklist (for example explaining what a W-9 is). Copy the item title exactly;
  {"kind":"add_item","label":"Add this to the checklist","itemType":"document" or "questionnaire","title":"<short client-facing title>","note":"<one plain-language sentence>"} when the client needs a NEW request that is not already on the list;
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
  if (o.kind === "annotate" && typeof o.itemTitle === "string" && o.itemTitle.trim() && typeof o.note === "string" && o.note.trim()) {
    return { kind: "annotate", label: label || "Add this note for the client", itemTitle: sanitize(o.itemTitle).slice(0, 200), note: sanitize(o.note).slice(0, 500) };
  }
  if (o.kind === "add_item" && typeof o.title === "string" && o.title.trim()) {
    return {
      kind: "add_item", label: label || "Add this to the checklist",
      title: sanitize(o.title).slice(0, 120),
      note: typeof o.note === "string" && o.note.trim() ? sanitize(o.note).slice(0, 500) : undefined,
      itemType: o.itemType === "questionnaire" ? "questionnaire" : "document",
    };
  }
  return { kind: "none" };
}

async function callInsight(ctx: InsightContext, key: string): Promise<ClientInsight> {
  const text = await chat(
    {
      max_tokens: 600,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: INSIGHT_SYSTEM },
        { role: "user", content: insightPrompt(ctx) },
      ],
    },
    key,
  );
  const start = text.indexOf("{"), end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("The AI did not return a usable read.");
  const parsed = JSON.parse(text.slice(start, end + 1)) as {
    headline?: string; insights?: string[]; recommendation?: string; action?: unknown;
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
  try {
    return await callInsight(ctx, key);
  } catch {
    return await callInsight(ctx, key);
  }
}
