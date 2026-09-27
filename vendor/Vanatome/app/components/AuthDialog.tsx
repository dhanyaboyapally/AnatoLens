"use client";

import { useState } from "react";
import { Activity, BarChart3, LogIn, LogOut, Moon, Sun, UserRound, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type AuthDialogProps = {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onOpenProgress: () => void;
};

type AuthFormProps = {
  onAuthenticated?: () => void;
};

export type ThemeMode = "dark" | "light";

export function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: ThemeMode;
  onToggle: () => void;
}) {
  const nextTheme = theme === "dark" ? "light" : "dark";
  const Icon = theme === "dark" ? Sun : Moon;

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
      aria-pressed={theme === "light"}
    >
      <Icon size={18} />
    </button>
  );
}

function AuthForm({ onAuthenticated }: AuthFormProps) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      if (!supabase) {
        setError("Supabase is not configured.");
        return;
      }

      const result = mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

      if (result.error) {
        setError(result.error.message);
      } else if (mode === "sign-up") {
        setMessage("Account created. Check your email if confirmation is enabled.");
      } else {
        onAuthenticated?.();
      }
    } catch (reason) {
      setError(reason instanceof Error
        ? reason.message
        : "Unable to reach the authentication service. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="auth-form">
      <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
      <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} /></label>
      {error && <p className="auth-error" role="alert">{error}</p>}
      {message && <p className="auth-success" role="status">{message}</p>}
      <button type="submit" className="auth-submit" disabled={busy || !supabase}>
        <LogIn size={14} /> {busy ? "PLEASE WAIT…" : mode === "sign-in" ? "SIGN IN" : "SIGN UP"}
      </button>
      {!supabase && <p className="auth-error" role="alert">Authentication is not configured.</p>}
      <button type="button" className="auth-mode-switch" onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setError(null); setMessage(null); }}>
        {mode === "sign-in" ? "Need an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </form>
  );
}

export function AuthPage({
  theme,
  onToggleTheme,
}: {
  theme: ThemeMode;
  onToggleTheme: () => void;
}) {
  return (
    <main className="auth-page app-shell" data-theme={theme}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="auth-page-brand">
        <div className="brand-mark" aria-hidden="true"><img src="/favicon.svg" alt="" /></div>
        <div>
          <div className="brand-name">AnatomyLens</div>
          <div className="brand-subtitle">INTERACTIVE ANATOMY LAB</div>
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </header>
      <section className="auth-page-content" aria-labelledby="auth-page-title">
        <div className="auth-page-intro">
          <span className="eyebrow">ANATOMY LENS ACCOUNT</span>
          <h1 id="auth-page-title">Enter the anatomy lab</h1>
          <p>Sign in or create an account to continue.</p>
        </div>
        <div className="auth-page-panel">
          <AuthForm />
        </div>
      </section>
      <footer className="auth-page-footer">EDUCATIONAL ANATOMY VISUALIZATION</footer>
    </main>
  );
}

export function AuthDialog({ open, user, onClose, onOpenProgress }: AuthDialogProps) {
  if (!open) return null;

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    onClose();
  };

  return (
    <div className="auth-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="auth-dialog-header">
          <div>
            <span className="eyebrow">ANATOMY LENS ACCOUNT</span>
            <h2 id="auth-dialog-title">{user ? "Your account" : "Sign in or create account"}</h2>
          </div>
          <button type="button" className="auth-dialog-close" onClick={onClose} aria-label="Close account dialog"><X size={17} /></button>
        </div>

        {user ? (
          <div className="auth-account-content">
            <UserRound size={28} />
            <p>{user.email}</p>
            <button type="button" className="auth-submit" onClick={onOpenProgress}><BarChart3 size={14} /> LEARNING PROGRESS</button>
            <button type="button" className="auth-submit" onClick={signOut}><LogOut size={14} /> SIGN OUT</button>
          </div>
        ) : (
          <AuthForm onAuthenticated={onClose} />
        )}
      </section>
    </div>
  );
}
