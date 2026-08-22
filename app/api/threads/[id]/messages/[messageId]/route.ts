import { getCurrentUser } from "@/lib/auth";
import { supabaseRestRequest } from "@/lib/supabase-rest";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> },
) {
  const { id, messageId } = await params;
  const auth = await getCurrentUser();
  if (!auth.user || !auth.accessToken) return new Response(null, { status: 401 });

  const body = (await req.json()) as {
    format: string;
    content: Record<string, unknown>;
  };

  const { response } = await supabaseRestRequest(
    `/gazioai_messages?id=eq.${encodeURIComponent(messageId)}&thread_id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(auth.user.id)}`,
    auth.accessToken,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ format: body.format, content: body.content }),
    },
  );

  return new Response(null, { status: response.ok ? 204 : response.status });
}
