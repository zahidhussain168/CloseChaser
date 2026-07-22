import { NextResponse } from "next/server";
import { saveAnswer } from "@/lib/portal";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export async function POST(
  req: Request,
  { params }: { params: { token: string } },
) {
  const limit = await rateLimit(`answer:${clientIp(req)}`, 60, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: { itemId?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (!body.itemId) {
    return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
  }

  const result = await saveAnswer(params.token, body.itemId, body.text ?? "");
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    state: result.item.state,
    answer_text: result.item.answer_text,
  });
}
