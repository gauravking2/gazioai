"use client";

import { useEffect, useState } from "react";
import { AssistantRuntimeProvider, useAui, useRemoteThreadListRuntime } from "@assistant-ui/react";
import { useChatRuntime, AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { PlusIcon } from "lucide-react";
import { Thread } from "@/components/thread";
import { ThreadListSidebar } from "@/components/threadlist-sidebar";
import { ModelSelector } from "@/components/model-selector";
import { GazioAILogo } from "@/components/gazioai-logo";
import { TooltipIconButton } from "@/components/tooltip-icon-button";
import { threadListAdapter } from "@/lib/thread-adapter";
import { useModelStore } from "@/lib/model-store";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export const Assistant = () => {
  // Pause decorative CSS animations while the tab is hidden to save battery/GPU.
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    const update = () => setIdle(document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  const runtime = useRemoteThreadListRuntime({
    runtimeHook: () =>
      useChatRuntime({
        sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
        transport: new AssistantChatTransport({
          api: "/api/chat",
          // Resolved fresh on every send, so switching models takes effect
          // immediately without recreating the runtime.
          body: () => ({ model: useModelStore.getState().modelId }),
        }),
      }),
    adapter: threadListAdapter,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <SidebarProvider>
        <div
          className="gazioai-shell flex h-dvh w-full pr-0.5 pt-[env(safe-area-inset-top)]"
          data-idle={idle}
        >
          <ThreadListSidebar />

          <SidebarInset className="gazioai-main">
            <header
              aria-label="Conversation header"
              className="gazioai-header relative flex h-14 shrink-0 items-center gap-1.5 border-b px-2.5 sm:gap-2.5 sm:px-4"
            >
              <SidebarTrigger className="size-8 shrink-0 rounded-full" />
              <Separator orientation="vertical" className="h-4 opacity-60" />
              <GazioAILogo size="sm" className="hidden min-[400px]:inline-flex" />

              <div className="min-w-0 flex-1" />

              <HeaderNewChat />
              <ModelSelector className="shrink-0" />
            </header>

            <div className="gazioai-chat flex-1 overflow-hidden">
              <div className="gazioai-ambient-glow" aria-hidden="true" />
              <Thread />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AssistantRuntimeProvider>
  );
};

const HeaderNewChat = () => {
  const aui = useAui();

  return (
    <TooltipIconButton
      tooltip="New chat"
      side="bottom"
      type="button"
      size="icon"
      className="text-muted-foreground hover:text-foreground size-8 rounded-full"
      aria-label="New chat"
      onClick={() => aui.threads.switchToNewThread()}
    >
      <PlusIcon className="size-4" />
    </TooltipIconButton>
  );
};
