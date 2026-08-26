"use client";

import { AssistantRuntimeProvider, useRemoteThreadListRuntime } from "@assistant-ui/react";
import { useChatRuntime, AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { Thread } from "@/components/thread";
import { ThreadListSidebar } from "@/components/threadlist-sidebar";
import { ModelSelector } from "@/components/model-selector";
import { threadListAdapter } from "@/lib/thread-adapter";
import { useModelStore } from "@/lib/model-store";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Menu } from "lucide-react";

export const Assistant = () => {
  const runtime = useRemoteThreadListRuntime({
    runtimeHook: () =>
      useChatRuntime({
        sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
        transport: new AssistantChatTransport({
          api: "/api/chat",
          body: () => ({ model: useModelStore.getState().modelId }),
        }),
      }),
    adapter: threadListAdapter,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <SidebarProvider>
        <div className="gazioai-shell flex h-dvh w-full pr-0.5">
          <ThreadListSidebar />

          <SidebarInset className="gazioai-main">
            <header className="gazioai-header relative flex h-16 shrink-0 items-center border-b px-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger
                  className="data-[state=open]:bg-white/5 hover:bg-white/5 text-white/70 hover:text-white transition-colors"
                >
                  <Menu className="size-5" />
                </SidebarTrigger>
                <Separator orientation="vertical" className="mr-2 h-5" />
              </div>

              <div className="pointer-events-none absolute left-1/2 -translate-x-1/2">
                <h1
                  className="gazioai-wordmark text-xl sm:text-2xl font-bold tracking-[-0.045em]"
                  aria-label="GAZIOAI"
                >
                  <span className="gazioai-wordmark-purple">GAZIO</span>
                  <span className="gazioai-wordmark-white">AI</span>
                </h1>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <ModelSelector />
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 font-mono text-[10px] uppercase tracking-wider">
                  <Sparkles className="size-3 text-violet-400" />
                  Free
                </div>
              </div>
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
