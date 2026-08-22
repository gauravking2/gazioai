import { clearSessionCookies, getTokensFromCookies } from "@/lib/auth";
import { supabaseAuthRequest } from "@/lib/supabase-rest";

export async function POST() {
  const { accessToken } = await getTokensFromCookies();
  if (accessToken) {
    await supabaseAuthRequest("/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    }).catch(() => undefined);
  }

  const result = Response.json({ ok: true });
  clearSessionCookies(result);
  return result;
}
