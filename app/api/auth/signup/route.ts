import { setSessionCookies } from "@/lib/auth";
import { supabaseAuthRequest } from "@/lib/supabase-rest";

type SignupResponse = {
  access_token?: string;
  refresh_token?: string;
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

    if (password.length < 6) {
      return Response.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const { response, data } = await supabaseAuthRequest<SignupResponse>("/signup", {
      method: "POST",
      body: JSON.stringify({ email: email.trim(), password }),
    });

    if (!response.ok) {
      const message =
        (data as { msg?: string; error_description?: string } | null)?.msg ??
        (data as { error_description?: string } | null)?.error_description ??
        "Unable to create the account.";
      return Response.json({ error: message }, { status: 400 });
    }

    if (data?.access_token && data.refresh_token) {
      const result = Response.json({ user: data.user ?? null, requiresConfirmation: false });
      setSessionCookies(result, data as { access_token: string; refresh_token: string });
      return result;
    }

    return Response.json({
      user: data?.user ?? null,
      requiresConfirmation: true,
      message: "Account created. Check your email to confirm it, then sign in.",
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to create the account." },
      { status: 500 },
    );
  }
}
