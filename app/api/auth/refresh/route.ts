import { refreshSession, setSessionCookies } from "@/lib/auth";

export async function POST() {
  const refreshed = await refreshSession();
  if (!refreshed?.access_token || !refreshed.refresh_token) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const result = Response.json({ ok: true });
  setSessionCookies(result, refreshed);
  return result;
}
