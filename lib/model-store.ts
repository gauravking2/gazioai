"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_MODEL_ID, resolveModelId } from "./models";

type ModelState = {
  /** Currently selected OpenRouter model id. */
  modelId: string;
  /** Update the selected model (validated against the free-model allow-list). */
  setModelId: (id: string) => void;
};

/**
 * Selected-model store, persisted to localStorage so the user's choice sticks
 * across reloads. Read outside React via `useModelStore.getState().modelId`
 * (used by the chat transport to send the model with each request).
 */
export const useModelStore = create<ModelState>()(
  persist(
    (set) => ({
      modelId: DEFAULT_MODEL_ID,
      setModelId: (id) => set({ modelId: resolveModelId(id) }),
    }),
    {
      name: "gazioai-selected-model",
      // Normalise the persisted id through the allow-list on load, so a model
      // that was removed or renamed (e.g. an old free slug no longer offered)
      // falls back to a valid current model instead of lingering as a stale,
      // unselectable choice.
      merge: (persisted, current) => ({
        ...current,
        modelId: resolveModelId((persisted as Partial<ModelState> | undefined)?.modelId),
      }),
    },
  ),
);
