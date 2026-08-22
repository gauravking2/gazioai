import { cookies } from "next/headers";
import { supabaseAuthRequest } from "./supabase-rest";

export const ACCESS_COOKIE = "gazioai_access_token";
export const REFRESH_COOKIE = "gazioai_refresh_token";

export type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

type RefreshResponse = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  user?: SupabaseUser;
};

export function setSessionCookies(
  response: Response,
  session: { access_token: string; refresh_token: string },
) {
  const secure = process.env.NODE_ENV === "production";
  const common = {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  };

  response.headers.append(
    "Set-Cookie",
    `${ACCESS_COOKIE}=${encodeURIComponent(session.access_token)}; Max-Age=${common.maxAge}; Path=/; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`,
  );
  response.headers.append(
    "Set-Cookie",
    `${REFRESH_COOKIE}=${encodeURIComponent(session.refresh_token)}; Max-Age=${common.maxAge}; Path=/; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`,
  );
}

export function clearSessionCookies(response: Response) {
  const secure = process.env.NODE_ENV === "production";
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) {
    response.headers.append(
      "Set-Cookie",
      `${name}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`,
    );
  }
}

export async function getCurrentUser(): Promise<{
  user: SupabaseUser | null;
  accessToken: string | null;
}> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!accessToken) {
    return { user: null, accessToken: null };
  }

  const { response, data } = await supabaseAuthRequest<SupabaseUser>("/user", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.ok && data?.id) {
    return { user: data, accessToken };
  }

  return { user: null, accessToken: null };
}

export async function getTokensFromCookies() {
  const cookieStore = await cookies();
  return {
    accessToken: cookieStore.get(ACCESS_COOKIE)?.value ?? null,
    refreshToken: cookieStore.get(REFRESH_COOKIE)?.value ?? null,
  };
}

export async function refreshSession() {
  const { refreshToken } = await getTokensFromCookies();
  if (!refreshToken) return null;

  const { response, data } = await supabaseAuthRequest<RefreshResponse>(
    "/token?grant_type=refresh_token",
    {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    },
  );

  if (!response.ok || !data?.access_token || !data.refresh_token) {
    return null;
  }

  return data;
}
