"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Cpu, Eye, Zap } from "lucide-react";
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

  // Close on outside click / Escape / scroll-away while open.
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
    const onScroll = (event: Event) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("scroll", onScroll, true);
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
        className={cn(
          "group flex h-9 max-w-[140px] items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-left backdrop-blur-sm transition-all hover:border-violet-400/40 hover:bg-white/[0.08] hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40 sm:max-w-[210px]",
        )}
      >
        <Cpu className="size-4 shrink-0 text-violet-300/80" />
        <span className="flex min-w-0 flex-col leading-none">
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.16em] text-white/35 sm:block">
            Model
          </span>
          <span className="mt-0.5 truncate text-[13px] font-medium text-white/90">{label}</span>
        </span>
        <ChevronsUpDown
          className={cn(
            "size-3.5 shrink-0 transition-all duration-200",
            open ? "rotate-180 text-violet-300" : "text-white/40",
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Free models"
          aria-activedescendant={`model-option-${activeId}`}
          className="model-dropdown-enter gazioai-scrollbar absolute right-0 top-[calc(100%+8px)] z-50 max-h-[min(70vh,440px)] w-[min(340px,calc(100vw-1.5rem))] overflow-y-auto overflow-x-hidden rounded-2xl border border-white/10 bg-[#0d0d15]/98 p-1.5 shadow-2xl shadow-black/60"
        >
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">
              Free models
            </span>
            <span className="font-mono text-[9px] tabular-nums text-white/25">
              {FREE_MODELS.length} available
            </span>
          </div>
          {FREE_MODELS.map((model) => {
            const active = model.id === activeId;
            const ctx = formatContext(model.context);
            const recommended = model.id === DEFAULT_MODEL_ID;
            return (
              <button
                key={model.id}
                id={`model-option-${model.id}`}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  setModelId(model.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors",
                  active
                    ? "bg-violet-500/15 shadow-[inset_0_0_0_1px_rgba(168,85,247,0.25)]"
                    : "hover:bg-white/5",
                )}
              >
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
                  {active ? (
                    <Check className="zoom-in-50 animate-in size-4 text-violet-300 duration-200 motion-reduce:animate-none" />
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
                    {recommended && (
                      <span className="flex shrink-0 items-center gap-0.5 rounded-full border border-amber-300/25 bg-amber-400/10 px-1.5 py-px font-mono text-[9px] uppercase tracking-wider text-amber-200/90">
                        <Zap className="size-2.5" />
                        Auto
                      </span>
                    )}
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
