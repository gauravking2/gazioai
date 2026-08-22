import { createOpenAI } from "@ai-sdk/openai";
import { streamText, convertToModelMessages } from "ai";
import { getCurrentUser } from "@/lib/auth";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
  const { user } = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const { messages } = await req.json();

  const result = streamText({
    model: openrouter("openrouter/free"),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
