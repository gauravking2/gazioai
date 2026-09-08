"use client";

import { useEffect, useState } from "react";
import { DownloadIcon } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * "Install app" row shown in the sidebar footer when the browser allows the
 * PWA install prompt. Renders nothing when already installed or unsupported.
 */
export function PwaInstall() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setPromptEvent(null);
      setStandalone(true);
    };

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setStandalone(true);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (standalone || !promptEvent) return null;

  return (
    <button
      type="button"
      onClick={() => {
        void promptEvent.prompt();
        setPromptEvent(null);
      }}
      className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start transition-colors hover:bg-white/[0.04]"
    >
      <div className="flex aspect-square size-8 items-center justify-center rounded-lg border border-violet-400/25 bg-violet-500/10 text-violet-300">
        <DownloadIcon className="size-4" />
      </div>
      <div className="min-w-0 flex flex-1 flex-col gap-0.5 leading-none">
        <span className="truncate font-semibold text-white/90">Install app</span>
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">
          add to home screen
        </span>
      </div>
    </button>
  );
}
