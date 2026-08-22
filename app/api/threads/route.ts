import { generateId } from "@assistant-ui/react";
import { getCurrentUser } from "@/lib/auth";
import { supabaseRestRequest } from "@/lib/supabase-rest";

export async function GET() {
  const { user, accessToken } = await getCurrentUser();
  if (!user || !accessToken) return new Response(null, { status: 401 });

  const { response, data } = await supabaseRestRequest<ThreadRow[]>(
    `/gazioai_threads?select=id,title,status,custom,created_at,updated_at&user_id=eq.${encodeURIComponent(user.id)}&order=updated_at.desc`,
    accessToken,
  );

  if (!response.ok) {
    return Response.json({ error: "Unable to load threads." }, { status: response.status });
  }

  return Response.json(data ?? []);
}

export async function POST() {
  const { user, accessToken } = await getCurrentUser();
  if (!user || !accessToken) return new Response(null, { status: 401 });

  const id = generateId();
  const now = new Date().toISOString();
  const { response } = await supabaseRestRequest<ThreadRow[]>("/gazioai_threads", accessToken, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      id,
      user_id: user.id,
      title: null,
      status: "regular",
      custom: {},
      created_at: now,
      updated_at: now,
    }),
  });

  if (!response.ok) {
    return Response.json({ error: "Unable to create thread." }, { status: response.status });
  }

  return Response.json({ id });
}

type ThreadRow = {
  id: string;
  user_id?: string;
  title: string | null;
  status: "regular" | "archived";
  custom?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
};
