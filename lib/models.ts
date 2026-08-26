// Curated list of free models shown in the GAZIOAI model switcher.
//
// Two providers are supported:
//   • "openrouter"    — free ":free" slugs, always available via OPENROUTER_API_KEY.
//   • "opencode-zen"  — OpenCode Zen (opencode.ai/zen), a separate OpenAI-compatible
//                        gateway that hosts the free "big-pickle" stealth model.
//                        These only appear when NEXT_PUBLIC_ENABLE_OPENCODE_ZEN="true"
//                        and require their own OPENCODE_ZEN_API_KEY on the server.
//
// Every OpenRouter model below was verified against the LIVE OpenRouter API
// (https://openrouter.ai/api/v1/models — $0 prompt/completion pricing) AND by
// sending a real chat-completion request that returned actual text. Slugs that
// were dead, paid-only, rate-limited into the ground, or restricted to "agentic
// harnesses" were dropped. The `vision` flag records which models actually
// accept image input; the chat API route strips attached images before calling
// a text-only model, so attaching an image can never hard-fail a request.
//
// The chat API route validates any incoming model id against this list before
// calling the provider, so a tampered request can never select a paid model.

export type ModelSource = "openrouter" | "opencode-zen" | "gemini";

export type FreeModel = {
  /** Exact model slug passed to the provider. */
  id: string;
  /** Short display name shown in the selector. */
  name: string;
  /** Provider label (shown as a small badge). */
  provider: string;
  /** One-line description. */
  blurb: string;
  /** Context window in tokens (0 = routed / not applicable). */
  context: number;
  /** Which backend serves this model. */
  source: ModelSource;
  /** True if the model accepts image input (verified via the live models API). */
  vision: boolean;
};

// --- OpenRouter free models (always available) --------------------------------
// This is the COMPLETE set of fully-free ($0 prompt/completion/request/image)
// text-chat models on OpenRouter, minus models that are structurally unusable
// or consistently failing in production:
//   • thinkingmachines/inkling(-small):free — 403 "only available on agentic harnesses"
//   • google/lyria-3-{pro,clip}-preview      — music-generation models, not chat
//   • nvidia/nemotron-3.5-content-safety:free — a moderation classifier, not an assistant
//   • z-ai/glm-5.2:free                      — consistently fails (provider error)
//   • google/gemma-4-31b-it:free             — consistently fails (provider error)
//   • google/gemma-4-26b-a4b-it:free         — consistently fails (provider error)
// Every model here was verified with real chat-completion requests. NOTE: all of
// these share OpenRouter's per-key DAILY free-tier cap, so any of them can return
// a transient 429 ("rate-limited") once the daily allowance is spent — that is a
// quota limit, not a broken model (the chat route reports it gracefully). The
// "Auto" router is marked non-vision on purpose: it may route to a text-only
// backend, so images are stripped for it to guarantee no image-input failures.
export const OPENROUTER_MODELS: FreeModel[] = [
  {
    id: "openrouter/free",
    name: "Auto (Best Free)",
    provider: "OpenRouter",
    blurb: "Auto-routes to an available free model",
    context: 0,
    source: "openrouter",
    vision: false,
  },
  {
    id: "minimax/minimax-m3:free",
    name: "MiniMax M3",
    provider: "MiniMax",
    blurb: "Flagship chat + vision, 1M context",
    context: 1048576,
    source: "openrouter",
    vision: true,
  },
  {
    id: "nvidia/nemotron-3-ultra-550b-a55b:free",
    name: "Nemotron 3 Ultra 550B",
    provider: "NVIDIA",
    blurb: "Largest free model, 1M context",
    context: 1000000,
    source: "openrouter",
    vision: false,
  },
  {
    id: "nvidia/nemotron-3-super-120b-a12b:free",
    name: "Nemotron 3 Super 120B",
    provider: "NVIDIA",
    blurb: "High capability, balanced speed",
    context: 262144,
    source: "openrouter",
    vision: false,
  },
  {
    id: "nvidia/nemotron-3.5-lightning:free",
    name: "Nemotron 3.5 Lightning",
    provider: "NVIDIA",
    blurb: "Very fast, 1M-token context",
    context: 1000000,
    source: "openrouter",
    vision: false,
  },
  {
    id: "stealth/ox-alpha",
    name: "Ox Alpha",
    provider: "Stealth",
    blurb: "Capable stealth model, 1M context, vision",
    context: 1048576,
    source: "openrouter",
    vision: true,
  },
  {
    id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    name: "Nemotron Nano Omni",
    provider: "NVIDIA",
    blurb: "Reasoning + vision, quick to respond",
    context: 256000,
    source: "openrouter",
    vision: true,
  },
  {
    id: "cohere/north-mini-code:free",
    name: "North Mini Code",
    provider: "Cohere",
    blurb: "Tuned for programming tasks",
    context: 256000,
    source: "openrouter",
    vision: false,
  },
  {
    id: "minimax/minimax-m2.7:free",
    name: "MiniMax M2.7",
    provider: "MiniMax",
    blurb: "Well-rounded general assistant",
    context: 196608,
    source: "openrouter",
    vision: false,
  },
  {
    id: "dots-studio/dots-3-note-preview:free",
    name: "Dots3 Note",
    provider: "Dots Studio",
    blurb: "Vision-capable, 512K context",
    context: 512000,
    source: "openrouter",
    vision: true,
  },
  {
    id: "liquid/lfm-2.5-2.6b:free",
    name: "LFM2.5 2.6B",
    provider: "LiquidAI",
    blurb: "Tiny and fast for quick replies",
    context: 65536,
    source: "openrouter",
    vision: false,
  },
];

// --- Google Gemini models (opt-in) --------------------------------------------
// Google's Gemini API via its OpenAI-compatible endpoint. These have their OWN
// generous daily free quota (per Google project), completely SEPARATE from
// OpenRouter's shared free cap — so they keep working when OpenRouter is
// rate-limited. Hidden unless NEXT_PUBLIC_ENABLE_GEMINI="true" and the server has
// GEMINI_API_KEY set (free key, no credit card: https://aistudio.google.com/apikey).
// Slugs are the stable, generally-available Gemini 2.5 family (verified on
// ai.google.dev); all are natively multimodal, so they accept image input.
export const GEMINI_MODELS: FreeModel[] = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Gemini",
    blurb: "Fast multimodal · separate free quota",
    context: 1048576,
    source: "gemini",
    vision: true,
  },
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash-Lite",
    provider: "Gemini",
    blurb: "Fastest, most efficient Gemini",
    context: 1048576,
    source: "gemini",
    vision: true,
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "Gemini",
    blurb: "Flagship reasoning & coding",
    context: 1048576,
    source: "gemini",
    vision: true,
  },
];

// --- OpenCode Zen models (opt-in) ---------------------------------------------
// Hidden unless NEXT_PUBLIC_ENABLE_OPENCODE_ZEN="true". Requires the server to
// have OPENCODE_ZEN_API_KEY set (get one at https://opencode.ai/zen).
export const OPENCODE_ZEN_MODELS: FreeModel[] = [
  {
    id: "big-pickle",
    name: "Big Pickle",
    provider: "OpenCode Zen",
    blurb: "Free stealth model on OpenCode Zen",
    context: 0,
    source: "opencode-zen",
    vision: false,
  },
  {
    id: "x-preview-f-free",
    name: "Ox Alpha (Free)",
    provider: "OpenCode Zen",
    blurb: "Free preview model on OpenCode Zen",
    context: 0,
    source: "opencode-zen",
    vision: false,
  },
  {
    id: "mimo-v2.5-free",
    name: "MiMo v2.5 (Free)",
    provider: "OpenCode Zen",
    blurb: "Free general model on OpenCode Zen",
    context: 0,
    source: "opencode-zen",
    vision: false,
  },
];

/** Whether OpenCode Zen models should be shown/selectable. */
export function isOpenCodeZenEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_OPENCODE_ZEN === "true";
}

/** Whether Google Gemini models should be shown/selectable. */
export function isGeminiEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_GEMINI === "true";
}

/**
 * Models offered in the selector. Gemini and OpenCode Zen models are only
 * included when explicitly enabled, so the app never shows a model it can't
 * actually call.
 */
export const FREE_MODELS: FreeModel[] = [
  ...OPENROUTER_MODELS,
  ...(isGeminiEnabled() ? GEMINI_MODELS : []),
  ...(isOpenCodeZenEnabled() ? OPENCODE_ZEN_MODELS : []),
];

/** Default model (the auto free router — always available, no key beyond OpenRouter). */
export const DEFAULT_MODEL: FreeModel = OPENROUTER_MODELS[0];
export const DEFAULT_MODEL_ID = DEFAULT_MODEL.id;

const MODEL_BY_ID = new Map(FREE_MODELS.map((m) => [m.id, m]));

/**
 * Returns the full model descriptor for an incoming id, or the default model
 * if the id is unknown / not currently selectable. The chat route relies on
 * this so it always calls an allow-listed model on the correct provider.
 */
export function resolveModel(id: unknown): FreeModel {
  return (typeof id === "string" && MODEL_BY_ID.get(id)) || DEFAULT_MODEL;
}

/** Convenience wrapper returning just the validated model id. */
export function resolveModelId(id: unknown): string {
  return resolveModel(id).id;
}

/** Whether the given (already-resolved) model id can accept image input. */
export function modelSupportsVision(id: unknown): boolean {
  return resolveModel(id).vision;
}

/** Human-readable context window, e.g. 262144 -> "262K", 1000000 -> "1M". */
export function formatContext(tokens: number): string {
  if (!tokens) return "";
  if (tokens >= 1_000_000) {
    const m = tokens / 1_000_000;
    return `${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  return `${Math.round(tokens / 1000)}K`;
}
