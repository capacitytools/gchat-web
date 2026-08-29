"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { GChatBackground } from "@/components/GChatBackground";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, UserPlus } from "lucide-react";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Account created! Try logging in.");
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Hard redirect to force session refresh
        window.location.href = "/"; 
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full max-w-md mx-auto text-white overflow-hidden font-sans">
      <GChatBackground />
      
      <div className="relative z-10 flex flex-col min-h-screen justify-center p-6">
        {/* Logo Area */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-bold text-black text-3xl shadow-lg shadow-emerald-500/30 mx-auto mb-4">G</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-cyan-200 to-emerald-300 bg-clip-text text-transparent">G-Chat Messenger</h1>
          <p className="text-sm text-gray-400 mt-2">Beyond Messaging</p>
        </div>
        {/* Form Card */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-1">{isSignUp ? "Create Account" : "Welcome Back"}</h2>
          <p className="text-sm text-gray-400 mb-6">{isSignUp ? "Join the future of communication" : "Sign in to continue"}</p>
          
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">Email</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>
            
            <button
              onClick={handleAuth}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : isSignUp ? <><UserPlus className="h-5 w-5" /> Sign Up</> : <><LogIn className="h-5 w-5" /> Sign In</>}
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </button>          </div>
        </div>
      </div>
    </div>
  );
}