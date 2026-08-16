"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { GButton } from "@/components/gbutton";

export function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setLoading(true);
    setStatus("");
    setError("");

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
      } else if (!data.session) {
        setStatus("Account created. Check your email if confirmation is required.");
      } else {
        setStatus("Account created. You are now signed in.");
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      }
    }
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-gcard border border-gborder bg-white p-4 dark:border-gdark-border dark:bg-gdark-surface"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h2>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setStatus("");
            setError("");
          }}
          className="text-sm font-medium text-gblue-primary"
        >
          {mode === "signin" ? "Create account" : "Sign in"}
        </button>
      </div>

      <label className="block">
        <span className="text-sm text-gmuted dark:text-gdark-muted">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="mt-1 w-full rounded-gbutton border border-gborder bg-white px-4 py-3 text-[15px] outline-none focus:border-ggreen-primary dark:border-gdark-border dark:bg-gdark-surface"
        />
      </label>

      <label className="block">
        <span className="text-sm text-gmuted dark:text-gdark-muted">Password</span>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 6 characters"
          className="mt-1 w-full rounded-gbutton border border-gborder bg-white px-4 py-3 text-[15px] outline-none focus:border-ggreen-primary dark:border-gdark-border dark:bg-gdark-surface"
        />
      </label>
      {status ? (
        <p className="text-sm text-gblue-primary">{status}</p>
      ) : null}

      {error ? <p className="text-sm text-gerror">{error}</p> : null}

      <GButton type="submit" disabled={loading} className="w-full">
        {loading
          ? "Please wait..."
          : mode === "signin"
            ? "Sign in"
            : "Create account"}
      </GButton>
    </form>
  );
}