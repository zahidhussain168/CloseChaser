import { NextResponse } from "next/server";
import { saveUpload } from "@/lib/portal";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import type { Attachment } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { token: string } },
) {
  const limit = rateLimit(`upload:${clientIp(req)}`, 40, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const itemId = form.get("itemId");
  const file = form.get("file");
  if (typeof itemId !== "string" || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing itemId or file" }, { status: 400 });
  }

  const result = await saveUpload(params.token, itemId, file);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    state: result.item.state,
    attachments: (result.item.attachments as Attachment[]).map((a) => ({
      name: a.name,
      size: a.size,
    })),
  });
}
