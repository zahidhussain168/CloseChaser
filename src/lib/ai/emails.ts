import "server-only";

/**
 * Generate the full chase-email ladder from a firm's own voice, so a
 * non-technical bookkeeper never edits raw templates. Uses the Anthropic
 * Messages API directly (no SDK). Gated on ANTHROPIC_API_KEY.
 */

export type EmailKind = "initial" | "level1" | "level2" | "level3" | "level4";
export type GeneratedTemplate = { subject: string; body: string };
export type GeneratedSet = Record<EmailKind, GeneratedTemplate>;

const KINDS: EmailKind[] = ["initial", "level1", "level2", "level3", "level4"];

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** No em/en dashes anywhere, per the product copy rule. Backstop the model. */
function sanitize(s: string): string {
  // Character class for em dash and en dash, built from code points so the
  // literal glyphs never appear in source (the copy guard forbids them).
  const cls = "[" + String.fromCharCode(0x2014, 0x2013) + "]";
  return s
    .replace(new RegExp("\\s*" + cls + "\\s*", "g"), ", ")
    .replace(new RegExp(cls, "g"), "-")
    .trim();
}

const SYSTEM = `You write email templates for RuledOff, a tool solo bookkeepers use to chase their own clients for the documents, receipts, and answers needed to close the books each month. You output ONLY valid JSON. No preamble, no markdown, no code fences.`;

function buildPrompt(firmName: string, voice: string, tone: string): string {
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

export async function generateChaseEmails(params: {
  firmName: string;
  voice: string;
  tone: string;
}): Promise<GeneratedSet> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("AI is not configured yet.");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      system: SYSTEM,
      messages: [{ role: "user", content: buildPrompt(params.firmName, params.voice, params.tone) }],
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`AI request failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  }

  const json = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = json.content?.find((c) => c.type === "text")?.text ?? "";

  // The model is told to return bare JSON; still, defensively extract the object.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
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
