const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  // This is intentionally checked at request time too, so local setup errors are obvious.
}

export function getSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }

  return {
    url: SUPABASE_URL.replace(/\/$/, ""),
    key: SUPABASE_PUBLISHABLE_KEY,
  };
}

export async function supabaseAuthRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ response: Response; data: T | null }> {
  const { url, key } = getSupabaseConfig();
  const headers = new Headers(options.headers);
  headers.set("apikey", key);
  headers.set("Content-Type", "application/json");

  const response = await fetch(`${url}/auth/v1${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  let data: T | null = null;
  try {
    data = (await response.json()) as T;
  } catch {
    data = null;
  }

  return { response, data };
}

export async function supabaseRestRequest<T>(
  path: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<{ response: Response; data: T | null }> {
  const { url, key } = getSupabaseConfig();
  const headers = new Headers(options.headers);
  headers.set("apikey", key);
  headers.set("Authorization", `Bearer ${accessToken}`);
  headers.set("Content-Type", "application/json");

  const response = await fetch(`${url}/rest/v1${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  let data: T | null = null;
  try {
    data = (await response.json()) as T;
  } catch {
    data = null;
  }

  return { response, data };
}
