"use client";

import type * as React from "react";
import { LogOut, MessagesSquare, ShieldCheck } from "lucide-react";
import { GitHubIcon } from "@/components/github";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ThreadList } from "@/components/thread-list";
import { useEffect, useState } from "react";

export function ThreadListSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
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
      <SidebarHeader className="aui-sidebar-header mb-2 border-b">
        <div className="aui-sidebar-header-content flex items-center justify-between">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                render={<a href="/" aria-label="GAZIOAI" />}
              >
                <div className="aui-sidebar-header-icon-wrapper bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <MessagesSquare className="aui-sidebar-header-icon size-4" />
                </div>
                <div className="aui-sidebar-header-heading me-6 flex flex-col gap-0.5 leading-none">
                  <span className="aui-sidebar-header-title font-semibold">
                    GAZIOAI
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">
                    secure console
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarHeader>

      <SidebarContent className="aui-sidebar-content px-2">
        <ThreadList />
      </SidebarContent>

      {props.collapsible !== "none" && <SidebarRail />}

      <SidebarFooter className="aui-sidebar-footer border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={
                <a
                  href="https://github.com/gauravking2/gazioai"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <div className="aui-sidebar-footer-icon-wrapper bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <GitHubIcon className="aui-sidebar-footer-icon size-4" />
              </div>
              <div className="aui-sidebar-footer-heading flex flex-col gap-0.5 leading-none">
                <span className="aui-sidebar-footer-title font-semibold">
                  GitHub
                </span>
                <span>View Source</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={logout}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-300">
                <LogOut className="size-4" />
              </div>
              <div className="min-w-0 flex flex-1 flex-col gap-0.5 leading-none">
                <span className="truncate font-semibold">
                  {email ?? "Signed in"}
                </span>
                <span className="flex items-center gap-1 text-white/35">
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
