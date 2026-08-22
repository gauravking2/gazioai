"use client";

import {
  RuntimeAdapterProvider,
  useAui,
  type RemoteThreadListAdapter,
  type ThreadHistoryAdapter,
} from "@assistant-ui/react";
import { createAssistantStream } from "assistant-stream";
import { useMemo } from "react";

const ensureOk = (response: Response) => {
  if (!response.ok) {
    if (response.status === 401) throw new Error("AUTH_REQUIRED");
    throw new Error(`Request failed (${response.status})`);
  }
};

const parse = async <T,>(response: Response): Promise<T> => {
  ensureOk(response);
  return (await response.json()) as T;
};

export const threadListAdapter: RemoteThreadListAdapter = {
  async list() {
    const rows = await parse<ThreadRow[]>(await fetch("/api/threads", { cache: "no-store" }));
    return {
      threads: rows.map((thread) => ({
        status: thread.status,
        remoteId: thread.id,
        title: thread.title ?? undefined,
        lastMessageAt: thread.updated_at ? new Date(thread.updated_at) : undefined,
      })),
    };
  },

  async initialize() {
    const { id } = await parse<{ id: string }>(
      await fetch("/api/threads", { method: "POST" }),
    );
    return { remoteId: id };
  },

  async rename(remoteId, title) {
    await fetch(`/api/threads/${remoteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  },

  async archive(remoteId) {
    await fetch(`/api/threads/${remoteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "archived" }),
    });
  },

  async unarchive(remoteId) {
    await fetch(`/api/threads/${remoteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "regular" }),
    });
  },

  async delete(remoteId) {
    await fetch(`/api/threads/${remoteId}`, { method: "DELETE" });
  },

  async fetch(remoteId) {
    const thread = await parse<ThreadRow>(
      await fetch(`/api/threads/${remoteId}`, { cache: "no-store" }),
    );
    return {
      status: thread.status,
      remoteId: thread.id,
      title: thread.title ?? undefined,
      lastMessageAt: thread.updated_at ? new Date(thread.updated_at) : undefined,
    };
  },

  async generateTitle(remoteId, messages) {
    return createAssistantStream(async (controller) => {
      const firstUserMessage = messages.find((message) => message.role === "user");
      const text = firstUserMessage?.content
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join(" ")
        .trim();
      const title = makeTitle(text || "New Chat");

      await fetch(`/api/threads/${remoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      controller.appendText(title);
    });
  },

  unstable_Provider({ children }) {
    const aui = useAui();
    const history = useMemo<ThreadHistoryAdapter>(
      () => ({
        async load() {
          return { messages: [] };
        },
        async append() {},
        withFormat: (fmt) => ({
          async load() {
            const { remoteId } = aui.threadListItem.getState();
            if (!remoteId) return { messages: [] };

            const rows = await parse<MessageRow[]>(
              await fetch(`/api/threads/${remoteId}/messages`, { cache: "no-store" }),
            );

            return {
              messages: rows.map((row) =>
                fmt.decode({
                  id: row.id,
                  parent_id: row.parent_id,
                  format: row.format,
                  content: row.content as Parameters<typeof fmt.decode>[0]["content"],
                }),
              ),
            };
          },

          async append(item) {
            const { remoteId } = await aui.threadListItem.initialize();
            const response = await fetch(`/api/threads/${remoteId}/messages`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: fmt.getId(item.message),
                parent_id: item.parentId,
                format: fmt.format,
                content: fmt.encode(item),
              }),
            });
            ensureOk(response);
          },

          async update(item, localMessageId) {
            const { remoteId } = await aui.threadListItem.initialize();
            await fetch(`/api/threads/${remoteId}/messages/${localMessageId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                format: fmt.format,
                content: fmt.encode(item),
              }),
            });
          },
        }),
      }),
      [aui],
    );

    return (
      <RuntimeAdapterProvider adapters={{ history }}>
        {children}
      </RuntimeAdapterProvider>
    );
  },
};

type ThreadRow = {
  id: string;
  title: string | null;
  status: "regular" | "archived";
  updated_at?: string | null;
};

type MessageRow = {
  id: string;
  parent_id: string | null;
  format: string;
  content: Record<string, unknown>;
};

function makeTitle(value: string) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= 34) return clean;
  return `${clean.slice(0, 31).trimEnd()}...`;
}
