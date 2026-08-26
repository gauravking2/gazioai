import { createOpenAI } from "@ai-sdk/openai";
import { streamText, convertToModelMessages } from "ai";
import { getCurrentUser } from "@/lib/auth";
import { DEFAULT_MODEL, resolveModel } from "@/lib/models";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// OpenCode Zen is OpenAI-compatible; only usable when its key is configured.
const openCodeZen = process.env.OPENCODE_ZEN_API_KEY
  ? createOpenAI({
      baseURL: "https://opencode.ai/zen/v1",
      apiKey: process.env.OPENCODE_ZEN_API_KEY,
    })
  : null;

// Google Gemini via its OpenAI-compatible endpoint. Free models here have their
// own daily quota, separate from OpenRouter's shared free cap, so they keep
// working when OpenRouter is rate-limited. Only usable when GEMINI_API_KEY is set.
const gemini = process.env.GEMINI_API_KEY
  ? createOpenAI({
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
      apiKey: process.env.GEMINI_API_KEY,
    })
  : null;

export async function POST(req: Request) {
  const { user } = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const { messages, model } = await req.json();

  // Only ever call an allow-listed model; fall back to the default otherwise.
  let selected = resolveModel(model);

  // If an OpenCode Zen model is requested but no key is configured, fall back
  // to the default free OpenRouter model so the chat keeps working.
  if (selected.source === "opencode-zen" && !openCodeZen) {
    console.warn(
      `[chat] OpenCode Zen model "${selected.id}" requested but OPENCODE_ZEN_API_KEY is not set; falling back to ${DEFAULT_MODEL.id}.`,
    );
    selected = DEFAULT_MODEL;
  }

  // Same graceful fallback if a Gemini model is picked without a configured key.
  if (selected.source === "gemini" && !gemini) {
    console.warn(
      `[chat] Gemini model "${selected.id}" requested but GEMINI_API_KEY is not set; falling back to ${DEFAULT_MODEL.id}.`,
    );
    selected = DEFAULT_MODEL;
  }

  let provider = openrouter;
  if (selected.source === "gemini" && gemini) {
    provider = gemini;
  } else if (selected.source === "opencode-zen" && openCodeZen) {
    provider = openCodeZen;
  }
  // Use the explicit .chat() factory (Chat Completions). Gemini's OpenAI-compat
  // endpoint doesn't implement the Responses API, and this is identical to the
  // default for the OpenRouter / OpenCode Zen providers, so it's safe for all.
  const languageModel = provider.chat(selected.id);

  // Text-only models reject requests that carry image attachments with a hard
  // "No endpoints found that support image input" error. Strip image/file parts
  // (leaving a short note) so attaching an image degrades gracefully instead of
  // failing the whole message. Vision models receive the images untouched.
  const outgoing = selected.vision ? messages : stripImageParts(messages);

  const result = streamText({
    model: languageModel,
    messages: await convertToModelMessages(outgoing),
  });

  // Surface a helpful reason instead of the default masked "An error occurred",
  // so an unavailable/rate-limited free model tells the user what to do next.
  return result.toUIMessageStreamResponse({
    onError: (error) => describeModelError(error, selected.name),
  });
}

// Remove image/file attachment parts from user messages so a text-only model
// never receives image input (which OpenRouter rejects outright). A short note
// replaces them so the model can respond sensibly instead of seeing nothing.
function stripImageParts(messages: unknown): unknown {
  if (!Array.isArray(messages)) return messages;
  return messages.map((message) => {
    if (
      !message ||
      typeof message !== "object" ||
      !Array.isArray((message as { parts?: unknown }).parts)
    ) {
      return message;
    }
    const parts = (message as { parts: Array<{ type?: string }> }).parts;
    const hadImage = parts.some((part) => part?.type === "file" || part?.type === "image");
    if (!hadImage) return message;

    const kept = parts.filter((part) => part?.type !== "file" && part?.type !== "image");
    kept.push({
      type: "text",
      text: "[An image was attached, but the selected model can't view images. Switch to a vision model (e.g. MiniMax M3), or describe the image in words.]",
    } as { type: string });
    return { ...(message as object), parts: kept };
  });
}

function describeModelError(error: unknown, modelName: string): string {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const text = raw.toLowerCase();

  if (text.includes("agentic harness")) {
    return `${modelName} isn't available for chat apps on OpenRouter right now. Please pick a different model.`;
  }
  if (text.includes("rate limit") || text.includes("429") || text.includes("quota")) {
    return `${modelName} is rate-limited at the moment (free models share a daily cap). Try again shortly or switch models.`;
  }
  if (text.includes("api key") || text.includes("unauthor") || text.includes("401")) {
    return `The provider rejected the request for ${modelName}. Check the API key configuration.`;
  }
  if (raw) {
    return `${modelName} couldn't complete the response: ${raw}. Try again or switch models.`;
  }
  return `${modelName} couldn't complete the response. Try again or switch models.`;
}
