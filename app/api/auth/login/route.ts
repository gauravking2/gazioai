import { setSessionCookies } from "@/lib/auth";
import { supabaseAuthRequest } from "@/lib/supabase-rest";

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  user?: { id: string; email?: string };
};

export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json()) as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return Response.json({ error: "Email and password are required." }, { status: 400 });
    }

    const { response, data } = await supabaseAuthRequest<TokenResponse>(
      "/token?grant_type=password",
      {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      },
    );

    if (!response.ok || !data?.access_token || !data.refresh_token) {
      const message =
        (data as { error_description?: string; msg?: string } | null)?.error_description ??
        (data as { msg?: string } | null)?.msg ??
        "Unable to sign in.";
      return Response.json({ error: message }, { status: 401 });
    }

    const result = Response.json({
      user: data.user ?? null,
    });
    setSessionCookies(result, data);
    return result;
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to sign in." },
      { status: 500 },
    );
  }
}
