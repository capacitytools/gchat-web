"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { GButton } from "@/components/gbutton";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const supabase = createClient();

  const handleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Account created! Try logging in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Force hard refresh to load the session
        window.location.href = "/"; 
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gbackground p-4 dark:bg-gdark-background">
      <div className="w-full max-w-sm rounded-gcard border border-gborder bg-white p-6 dark:border-gdark-border dark:bg-gdark-surface">
        <h1 className="font-heading text-2xl font-semibold text-ggreen-primary">G-Chat</h1>
        <p className="mt-2 text-sm text-gmuted dark:text-gdark-muted">
          {isSignUp ? "Create your account" : "Sign in to continue"}
        </p>
        
        {error && (
          <div className="mt-4 rounded bg-gerror/10 p-3 text-sm text-gerror">{error}</div>
        )}

        <div className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-gbutton border border-gborder bg-white px-4 py-3 text-[15px] outline-none focus:border-ggreen-primary dark:border-gdark-border dark:bg-gdark-surface"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-gbutton border border-gborder bg-white px-4 py-3 text-[15px] outline-none focus:border-ggreen-primary dark:border-gdark-border dark:bg-gdark-surface"
          />
          
          <GButton onClick={handleAuth} disabled={loading} className="w-full">
            {loading ? "Loading..." : (isSignUp ? "Sign Up" : "Sign In")}
          </GButton>
          
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-center text-sm text-gpurple-primary hover:underline"
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}