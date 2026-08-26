"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Cpu, Eye } from "lucide-react";
import { DEFAULT_MODEL_ID, FREE_MODELS, formatContext } from "@/lib/models";
import { useModelStore } from "@/lib/model-store";
import { cn } from "@/lib/utils";

export function ModelSelector({ className }: { className?: string }) {
  const modelId = useModelStore((s) => s.modelId);
  const setModelId = useModelStore((s) => s.setModelId);

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Only reflect the persisted value after mount to avoid any hydration flash.
  useEffect(() => setMounted(true), []);

  // Close on outside click / Escape while open.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const current =
    FREE_MODELS.find((m) => m.id === modelId) ??
    FREE_MODELS.find((m) => m.id === DEFAULT_MODEL_ID) ??
    FREE_MODELS[0];

  const activeId = mounted ? current.id : DEFAULT_MODEL_ID;
  const label = mounted ? current.name : FREE_MODELS[0].name;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select AI model"
        onClick={() => setOpen((value) => !value)}
        className="group flex h-9 max-w-[210px] sm:max-w-[210px] max-w-[140px] items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 text-left transition-colors hover:border-violet-400/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40"
      >
        <Cpu className="size-4 shrink-0 text-violet-300/80" />
        <span className="flex min-w-0 flex-col leading-none">
          <span className="hidden sm:block font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
            Model
          </span>
          <span className="mt-0.5 truncate text-[13px] font-medium text-white/90">{label}</span>
        </span>
        <ChevronsUpDown
          className={cn(
            "size-3.5 shrink-0 transition-colors",
            open ? "text-violet-300" : "text-white/40",
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Free models"
          className="absolute right-0 top-[calc(100%+8px)] z-50 max-h-[min(70vh,440px)] w-[min(320px,calc(100vw-1.5rem))] origin-top-right overflow-y-auto overflow-x-hidden rounded-xl border border-white/10 bg-[#0d0d15] p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl"
        >
          <div className="px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">
            Free models
          </div>
          {FREE_MODELS.map((model) => {
            const active = model.id === activeId;
            const ctx = formatContext(model.context);
            return (
              <button
                key={model.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  setModelId(model.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                  active ? "bg-violet-500/15" : "hover:bg-white/5",
                )}
              >
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
                  {active ? (
                    <Check className="size-4 text-violet-300" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-white/20" />
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-medium text-white/90">
                      {model.name}
                    </span>
                    <span className="shrink-0 rounded-full border border-white/10 px-1.5 py-px font-mono text-[9px] uppercase tracking-wider text-white/45">
                      {model.provider}
                    </span>
                    {model.vision && (
                      <span
                        title="Supports image input"
                        className="flex shrink-0 items-center gap-0.5 rounded-full border border-violet-400/25 bg-violet-500/10 px-1.5 py-px font-mono text-[9px] uppercase tracking-wider text-violet-200/80"
                      >
                        <Eye className="size-2.5" />
                        Vision
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/45">
                    <span className="truncate">{model.blurb}</span>
                    {ctx && <span className="shrink-0 text-white/30">· {ctx}</span>}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
