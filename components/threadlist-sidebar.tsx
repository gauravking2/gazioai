"use client";

import type * as React from "react";
import { LogOut, PlusIcon, ShieldCheck, Sparkles } from "lucide-react";
import { GitHubIcon } from "@/components/github";
import { PwaInstall } from "@/components/pwa-install";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { ThreadList } from "@/components/thread-list";
import { useAui } from "@assistant-ui/react";
import { useEffect, useState } from "react";

export function ThreadListSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setEmail(data.user?.email ?? null))
      .catch(() => setEmail(null));
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.reload();
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader className="aui-sidebar-header gap-2 border-b border-white/[0.06] px-2 py-2.5">
        <div className="aui-sidebar-header-content flex items-center gap-2">
          <SidebarMenu className="min-w-0 flex-1">
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" render={<a href="/" aria-label="GAZIOAI home" />}>
                <div className="gazioai-sidebar-mark flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg">
                  <Sparkles className="aui-sidebar-header-icon size-4" />
                </div>
                <div className="aui-sidebar-header-heading me-2 flex min-w-0 flex-col gap-1 leading-none">
                  <span className="aui-sidebar-header-title text-sm font-semibold tracking-tight text-white/95">
                    GAZIOAI
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">
                    secure console
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarNewChatButton />
        </div>
      </SidebarHeader>

      <SidebarContent className="aui-sidebar-content gap-1 px-2 py-2">
        <ThreadList />
      </SidebarContent>

      {props.collapsible !== "none" && <SidebarRail />}

      <SidebarFooter className="aui-sidebar-footer gap-1 border-t border-white/[0.06] px-2 py-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <PwaInstall />
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              render={
                <a
                  href="https://github.com/gauravking2/gazioai"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GAZIOAI on GitHub"
                />
              }
            >
              <div className="aui-sidebar-footer-icon-wrapper bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg">
                <GitHubIcon className="aui-sidebar-footer-icon size-4" />
              </div>
              <div className="aui-sidebar-footer-heading flex min-w-0 flex-col gap-1 leading-none">
                <span className="aui-sidebar-footer-title text-[13px] font-medium text-white/80">
                  GitHub
                </span>
                <span className="text-[11px] text-white/35">View source</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} aria-label="Sign out">
              <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-300">
                <LogOut className="size-4" />
              </div>
              <div className="min-w-0 flex flex-1 flex-col gap-1 leading-none">
                <span className="truncate text-[13px] font-medium text-white/80">
                  {email ?? "Signed in"}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-white/35">
                  <ShieldCheck className="size-3" />
                  Sign out
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

const SidebarNewChatButton = () => {
  const aui = useAui();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <button
      type="button"
      aria-label="Start a new chat"
      title="New chat"
      onClick={() => {
        aui.threads.switchToNewThread();
        if (isMobile) setOpenMobile(false);
      }}
      className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition-colors hover:border-violet-400/40 hover:text-white active:scale-95"
    >
      <PlusIcon className="size-4" />
    </button>
  );
};
