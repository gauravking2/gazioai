import { getCurrentUser } from "@/lib/auth";
import { supabaseRestRequest } from "@/lib/supabase-rest";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await getCurrentUser();
  if (!auth.user || !auth.accessToken) return new Response(null, { status: 401 });

  const thread = await supabaseRestRequest<ThreadRow[]>(
    `/gazioai_threads?select=id&id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(auth.user.id)}&limit=1`,
    auth.accessToken,
  );
  if (!thread.response.ok || !thread.data?.[0]) {
    return new Response(null, { status: thread.response.ok ? 404 : thread.response.status });
  }

  const { response, data } = await supabaseRestRequest<MessageRow[]>(
    `/gazioai_messages?select=id,thread_id,parent_id,format,content,created_at&thread_id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(auth.user.id)}&order=created_at.asc`,
    auth.accessToken,
  );

  if (!response.ok) {
    return Response.json({ error: "Unable to load messages." }, { status: response.status });
  }

  return Response.json(data ?? []);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await getCurrentUser();
  if (!auth.user || !auth.accessToken) return new Response(null, { status: 401 });

  const body = (await req.json()) as {
    id: string;
    parent_id: string | null;
    format: string;
    content: Record<string, unknown>;
  };

  const thread = await supabaseRestRequest<ThreadRow[]>(
    `/gazioai_threads?select=id&id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(auth.user.id)}&limit=1`,
    auth.accessToken,
  );
  if (!thread.response.ok || !thread.data?.[0]) {
    return new Response(null, { status: thread.response.ok ? 404 : thread.response.status });
  }

  const { response } = await supabaseRestRequest("/gazioai_messages", auth.accessToken, {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      id: body.id,
      thread_id: id,
      user_id: auth.user.id,
      parent_id: body.parent_id,
      format: body.format,
      content: body.content,
      created_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    return Response.json({ error: "Unable to save message." }, { status: response.status });
  }

  await supabaseRestRequest(
    `/gazioai_threads?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(auth.user.id)}`,
    auth.accessToken,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ updated_at: new Date().toISOString() }),
    },
  );

  return new Response(null, { status: 204 });
}

type ThreadRow = { id: string };
type MessageRow = {
  id: string;
  thread_id: string;
  parent_id: string | null;
  format: string;
  content: Record<string, unknown>;
  created_at?: string;
};
