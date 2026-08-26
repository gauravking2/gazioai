"use client";

import { AssistantRuntimeProvider, useRemoteThreadListRuntime } from "@assistant-ui/react";
import {
  useChatRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { Thread } from "@/components/thread";
import { ThreadListSidebar } from "@/components/threadlist-sidebar";
import { ModelSelector } from "@/components/model-selector";
import { threadListAdapter } from "@/lib/thread-adapter";
import { useModelStore } from "@/lib/model-store";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export const Assistant = () => {
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
        <div className="gazioai-shell flex h-dvh w-full pr-0.5">
          <ThreadListSidebar />

          <SidebarInset className="gazioai-main">
            <header className="gazioai-header relative flex h-16 shrink-0 items-center border-b px-4 gap-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <Separator orientation="vertical" className="mr-2 h-4" />
              </div>

              <div className="flex-1 flex justify-center min-w-0">
                <h1 className="gazioai-wordmark text-xl font-bold tracking-[-0.045em] truncate" aria-label="GAZIOAI">
                  <span className="gazioai-wordmark-purple">GAZIO</span>
                  <span className="gazioai-wordmark-white">AI</span>
                </h1>
              </div>

              <div className="flex-shrink-0">
                <ModelSelector />
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
