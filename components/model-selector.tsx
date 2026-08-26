"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Cpu, Eye, Sparkles } from "lucide-react";
import { DEFAULT_MODEL_ID, FREE_MODELS, formatContext } from "@/lib/models";
import { useModelStore } from "@/lib/model-store";
import { cn } from "@/lib/utils";

export function ModelSelector({ className }: { className?: string }) {
  const modelId = useModelStore((s) => s.modelId);
  const setModelId = useModelStore((s) => s.setModelId);

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

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
        className="group flex h-9 max-w-[220px] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-left transition-all hover:border-violet-400/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40"
      >
        <div className="relative flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20">
          <Cpu className="size-3.5 text-violet-300" />
          {current.vision && (
            <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-violet-500">
              <Eye className="size-2 text-white" />
            </span>
          )}
        </div>
        <span className="flex min-w-0 flex-col leading-none">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
            Model
          </span>
          <span className="mt-0.5 truncate text-[13px] font-medium text-white/90">{label}</span>
        </span>
        <ChevronsUpDown
          className={cn(
            "size-3.5 shrink-0 transition-all",
            open ? "text-violet-300 rotate-180" : "text-white/40",
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Free models"
          className="model-dropdown-enter absolute right-0 top-[calc(100%+8px)] z-50 max-h-[min(70vh,480px)] w-[min(340px,calc(100vw-1.5rem))] origin-top-right overflow-y-auto overflow-x-hidden rounded-2xl border border-white/10 bg-[#08080c] p-1.5 shadow-2xl shadow-black/60 backdrop-blur-2xl"
        >
          <div className="flex items-center gap-2 px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">
            <Sparkles className="size-3 text-violet-400" />
            Free models
            <span className="ml-auto rounded-full border border-white/10 px-1.5 py-px text-[10px] text-white/40">
              {FREE_MODELS.length}
            </span>
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
                  "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-all",
                  active
                    ? "bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-400/20"
                    : "hover:bg-white/5 hover:border-white/10",
                )}
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center">
                  {active ? (
                    <Check className="size-4 text-violet-300" />
                  ) : (
                    <span className="size-2 rounded-full bg-white/15" />
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-medium text-white/90">
                      {model.name}
                    </span>
                    <span className="shrink-0 rounded-full border border-white/10 px-2 py-px font-mono text-[9px] uppercase tracking-wider text-white/45">
                      {model.provider}
                    </span>
                    {model.vision && (
                      <span
                        title="Supports image input"
                        className="flex shrink-0 items-center gap-1 rounded-full border border-violet-400/25 bg-violet-500/10 px-2 py-px font-mono text-[9px] uppercase tracking-wider text-violet-200/80"
                      >
                        <Eye className="size-3" />
                        Vision
                      </span>
                    )}
                  </span>
                  <span className="mt-1 flex items-center gap-2 text-[11px] text-white/45">
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