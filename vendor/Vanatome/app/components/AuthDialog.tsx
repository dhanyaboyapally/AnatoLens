"use client";

import { useState } from "react";
import { LogIn, LogOut, UserRound, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type AuthDialogProps = {
  open: boolean;
  user: User | null;
  onClose: () => void;
};

export function AuthDialog({ open, user, onClose }: AuthDialogProps) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    if (!supabase) {
      setError("Supabase is not configured.");
      setBusy(false);
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
      onClose();
    }
    setBusy(false);
  };

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
            <h2 id="auth-dialog-title">{user ? "Your account" : mode === "sign-in" ? "Sign in" : "Create account"}</h2>
          </div>
          <button type="button" className="auth-dialog-close" onClick={onClose} aria-label="Close account dialog"><X size={17} /></button>
        </div>

        {user ? (
          <div className="auth-account-content">
            <UserRound size={28} />
            <p>{user.email}</p>
            <button type="button" className="auth-submit" onClick={signOut}><LogOut size={14} /> SIGN OUT</button>
          </div>
        ) : (
          <form onSubmit={submit} className="auth-form">
            <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
            <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} /></label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            {message && <p className="auth-success">{message}</p>}
            <button type="submit" className="auth-submit" disabled={busy}>
              <LogIn size={14} /> {busy ? "PLEASE WAIT…" : mode === "sign-in" ? "SIGN IN" : "SIGN UP"}
            </button>
            <button type="button" className="auth-mode-switch" onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setError(null); setMessage(null); }}>
              {mode === "sign-in" ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
