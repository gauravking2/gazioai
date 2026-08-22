import { getCurrentUser, refreshSession, setSessionCookies } from "@/lib/auth";
import { supabaseAuthRequest } from "@/lib/supabase-rest";

export async function GET() {
  try {
    const current = await getCurrentUser();
    if (current.user) {
      return Response.json({ user: current.user });
    }

    const refreshed = await refreshSession();
    if (!refreshed?.access_token || !refreshed.refresh_token) {
      return Response.json({ user: null });
    }

    const { response, data } = await supabaseAuthRequest<{
      id: string;
      email?: string;
      user_metadata?: Record<string, unknown>;
    }>("/user", {
      headers: { Authorization: `Bearer ${refreshed.access_token}` },
    });

    if (!response.ok || !data?.id) {
      return Response.json({ user: null });
    }

    const result = Response.json({ user: data });
    setSessionCookies(result, refreshed);
    return result;
  } catch (error) {
    return Response.json(
      { user: null, error: error instanceof Error ? error.message : "Auth unavailable" },
      { status: 200 },
    );
  }
}
