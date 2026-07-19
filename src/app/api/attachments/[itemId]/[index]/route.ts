import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Attachment } from "@/lib/types";

/**
 * Bookkeeper attachment download. RLS on the server client ensures the item
 * belongs to the signed-in user's firm; we then mint a short-lived signed URL
 * from the private bucket and redirect to it.
 */
export async function GET(
  _req: Request,
  { params }: { params: { itemId: string; index: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: item } = await supabase
    .from("items")
    .select("attachments")
    .eq("id", params.itemId)
    .maybeSingle();
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const attachments = (item.attachments ?? []) as Attachment[];
  const att = attachments[Number(params.index)];
  if (!att) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const admin = createAdminClient();
  const { data: signed, error } = await admin.storage
    .from("attachments")
    .createSignedUrl(att.path, 60);
  if (error || !signed) {
    return NextResponse.json({ error: "Could not sign URL" }, { status: 500 });
  }
  return NextResponse.redirect(signed.signedUrl);
}
