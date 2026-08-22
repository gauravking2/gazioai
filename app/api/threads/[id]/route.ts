import { getCurrentUser } from "@/lib/auth";
import { supabaseRestRequest } from "@/lib/supabase-rest";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await getCurrentUser();
  if (!auth.user || !auth.accessToken) return new Response(null, { status: 401 });

  const { response, data } = await supabaseRestRequest<ThreadRow[]>(
    `/gazioai_threads?select=id,title,status,custom,created_at,updated_at&id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(auth.user.id)}&limit=1`,
    auth.accessToken,
  );

  if (!response.ok || !data?.[0]) {
    return new Response(null, { status: response.ok ? 404 : response.status });
  }

  return Response.json(data[0]);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await getCurrentUser();
  if (!auth.user || !auth.accessToken) return new Response(null, { status: 401 });

  const patch = (await req.json()) as {
    title?: string | null;
    status?: "regular" | "archived";
    custom?: Record<string, unknown>;
  };

  const { response } = await supabaseRestRequest(
    `/gazioai_threads?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(auth.user.id)}`,
    auth.accessToken,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
    },
  );

  return new Response(null, { status: response.ok ? 204 : response.status });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await getCurrentUser();
  if (!auth.user || !auth.accessToken) return new Response(null, { status: 401 });

  const { response } = await supabaseRestRequest(
    `/gazioai_threads?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(auth.user.id)}`,
    auth.accessToken,
    { method: "DELETE" },
  );

  return new Response(null, { status: response.ok ? 204 : response.status });
}

type ThreadRow = {
  id: string;
  title: string | null;
  status: "regular" | "archived";
  custom?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
};
