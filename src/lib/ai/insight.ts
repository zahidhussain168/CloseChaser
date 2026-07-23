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

export type ClientInsight = { headline: string; insights: string[]; recommendation: string };

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

Be concrete and reference the actual items or behavior. If items are answered, tell them to review and rule those off. If the link is unopened after a chase, suggest a text or a firmer nudge. If a client may be confused by an item (like a W-9), suggest adding a plain-language note. Never use em dashes or en dashes. Plain, human language.

Output EXACTLY this JSON and nothing else:
{"headline":"","insights":["",""],"recommendation":""}`;
}

export async function generateClientInsight(ctx: InsightContext): Promise<ClientInsight> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("AI is not configured yet.");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json", "X-Title": "RuledOff" },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
      max_tokens: 500,
      temperature: 0.5,
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

  let parsed: { headline?: string; insights?: string[]; recommendation?: string };
  try {
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new Error("The AI response could not be read. Try again.");
  }

  return {
    headline: sanitize(parsed.headline ?? "Here is where things stand."),
    insights: (parsed.insights ?? []).slice(0, 3).map(sanitize).filter(Boolean),
    recommendation: sanitize(parsed.recommendation ?? "Review the open items and send a nudge."),
  };
}
