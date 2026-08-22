"use client";

import { useEffect, useState } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AuthUser = {
  id: string;
  email?: string;
};

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const check = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await response.json();
        if (active) setUser(data.user ?? null);
      } finally {
        if (active) setLoading(false);
      }
    };

    void check();

    const refreshTimer = window.setInterval(() => {
      void fetch("/api/auth/refresh", { method: "POST" });
    }, 45 * 60 * 1000);

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  if (loading) {
    return (
      <div className="auth-screen min-h-dvh bg-black text-white">
        <div className="auth-grid" />
        <div className="flex min-h-dvh items-center justify-center p-6">
          <div className="auth-loader">
            <div className="auth-loader-dot" />
            <span>INITIALIZING SECURE SESSION</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPanel />;

  return <>{children}</>;
}

function AuthPanel() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "Authentication failed.");
        return;
      }

      if (data.requiresConfirmation) {
        setMode("login");
        setMessage(data.message ?? "Check your email to confirm the account.");
        return;
      }

      window.location.reload();
    } catch {
      setMessage("Network error. Check the server and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-screen min-h-dvh bg-black text-white">
      <div className="auth-grid" aria-hidden="true" />
      <div className="auth-noise" aria-hidden="true" />

      <div className="relative z-10 flex min-h-dvh items-center justify-center p-5 sm:p-8">
        <section className="auth-card w-full max-w-md">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="auth-mark">
                <Terminal className="size-4" />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-[0.18em] text-white">
                  <span className="text-violet-400">GAZIO</span>AI
                </div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
                  secure intelligence interface
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-2.5 py-1 text-[10px] font-medium tracking-wider text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.9)]" />
              ONLINE
            </div>
          </div>

          <div className="mb-7">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.24em] text-violet-300/70">
              <ShieldCheck className="size-3.5" />
              Authenticated workspace
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {mode === "login" ? "Welcome back." : "Create your access."}
            </h1>
            <p className="mt-2 text-sm leading-6 text-white/45">
              Your conversations are tied to your account and can be restored from any device.
            </p>
          </div>

          <div className="mb-5 grid grid-cols-2 rounded-lg border border-white/10 bg-white/[0.025] p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
              className={`rounded-md px-3 py-2 text-sm transition ${mode === "login" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setMessage("");
              }}
              className={`rounded-md px-3 py-2 text-sm transition ${mode === "signup" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                identity / email
              </span>
              <Input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="h-11 border-white/10 bg-white/[0.035] text-white placeholder:text-white/20 focus-visible:ring-violet-500/50"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                <LockKeyhole className="size-3" />
                access key
              </span>
              <Input
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="h-11 border-white/10 bg-white/[0.035] text-white placeholder:text-white/20 focus-visible:ring-violet-500/50"
              />
            </label>

            {message && (
              <div className="rounded-lg border border-violet-400/20 bg-violet-500/[0.06] px-3 py-2.5 text-xs leading-5 text-violet-100/80">
                {message}
              </div>
            )}

            <Button
              type="submit"
              disabled={busy}
              className="h-11 w-full border-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600 font-medium text-white shadow-[0_0_30px_rgba(124,58,237,.18)] hover:brightness-110"
            >
              {busy ? "Authenticating..." : mode === "login" ? "Enter GAZIOAI" : "Initialize account"}
              {!busy && <ArrowRight className="ml-2 size-4" />}
            </Button>
          </form>

          <div className="mt-7 border-t border-white/8 pt-5 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-white/25">
            sessions encrypted in transit · thread history cloud synced
          </div>
        </section>
      </div>
    </main>
  );
}
