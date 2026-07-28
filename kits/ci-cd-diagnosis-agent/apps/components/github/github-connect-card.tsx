"use client";

import { useEffect, useState } from "react";

interface GitHubUser {
  login: string;
  avatarUrl: string;
  name?: string;
  email?: string;
}

export function GitHubConnectCard() {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check URL query parameters for OAuth success/error callbacks
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get("auth_error");
    const authSuccess = params.get("auth_success");

    if (authError) {
      setErrorMsg(authError);
      // Clean query params from URL without page reload
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (authSuccess) {
      // Clean query params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Fetch initial session state
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/github/session");
        if (res.ok) {
          const data = await res.json();
          if (data.connected && data.user) {
            setConnected(true);
            setUser(data.user);
          } else {
            setConnected(false);
            setUser(null);
          }
        }
      } catch {
        setErrorMsg("Failed to reach authentication server.");
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, []);

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/github/session", { method: "DELETE" });
      if (res.ok) {
        setConnected(false);
        setUser(null);
        setErrorMsg(null);
      }
    } catch {
      setErrorMsg("Failed to disconnect GitHub account.");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    window.location.href = "/api/auth/github/login";
  };

  return (
    <div className="glass-panel rounded-[24px] p-6 mb-6 transition-all duration-300">
      {errorMsg && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-400 hover:text-rose-200 text-sm font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
            <div className="space-y-1.5">
              <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-20 animate-pulse rounded bg-white/5" />
            </div>
          </div>
          <div className="h-8 w-24 animate-pulse rounded-xl bg-white/10" />
        </div>
      ) : connected && user ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={user.avatarUrl}
              alt={user.login}
              className="h-12 w-12 rounded-full border border-white/20 shadow-md object-cover"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-base tracking-tight">
                  {user.name || user.login}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-glow" />
                  GitHub Connected
                </span>
              </div>
              <p className="text-xs text-[var(--muted)] mt-0.5">@{user.login}</p>
            </div>
          </div>

          <button
            onClick={handleDisconnect}
            className="rounded-[14px] border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-[var(--text-dim)] hover:border-rose-500/40 hover:bg-rose-950/20 hover:text-rose-300 transition-all duration-200"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">GitHub Authentication</h3>
              <p className="text-xs text-[var(--muted)]">Connect your account to enable automatic CI/CD diagnosis</p>
            </div>
          </div>

          <button
            onClick={handleConnect}
            className="apple-button rounded-[14px] px-4 py-2.5 text-xs font-semibold shadow-md"
          >
            Connect GitHub
          </button>
        </div>
      )}
    </div>
  );
}
