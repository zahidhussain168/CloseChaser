import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** The signed-in bookkeeper's user id, or a redirect to sign in. */
export async function requireUserId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user.id;
}
