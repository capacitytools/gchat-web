"use client";

import { MessageCircle, Send, User } from "lucide-react";
import { GChatMenu } from "../GChatMenu";
import { NatureBackground } from "../NatureBackground";

type View = "home" | "list" | "conversation" | "wallet" | "feed" | "gtribe" | "gchatone" | "profile" | "edit-profile" | "analytics" | "settings";

interface HomeViewProps {
  setView: (view: View) => void;
  onLogout: () => void;
}

export function HomeView({ setView }: HomeViewProps) {
  return (
    <div className="nature-page relative min-h-screen">
      {/* Living nature atmosphere (rain, mist, rays, water, fireflies) */}
      <NatureBackground />

      <div className="relative z-10 flex flex-col min-h-screen p-6 pb-24">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 nature-enter">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-bold text-black text-xl">G</div>
            <span className="font-bold text-lg nature-title">G-Chat</span>
          </div>
          <button onClick={() => setView("profile")} className="p-2 rounded-full bg-white/5">
            <User className="h-5 w-5 text-amber-100/70" />
          </button>
        </div>

        {/* Hero */}
        <div className="text-center mb-8 mt-2 nature-enter" style={{ animationDelay: ".15s" }}>
          <h1 className="nature-title text-3xl sm:text-4xl font-bold mb-2">One World. One App.</h1>
          <p className="nature-gold text-base font-medium mb-2">Infinite Possibilities.</p>
          <p className="nature-sub text-sm">Chat Smarter. Live Better. Earn Together.</p>
        </div>

        {/* Living menu (icons keep their own animations) */}
        <GChatMenu onNavigate={setView} />

        <div className="flex-1" />

        {/* Message the world composer */}
        <button
          onClick={() => setView("list")}
          className="nature-composer nature-enter w-full p-4 rounded-2xl flex items-center gap-4"
          style={{ animationDelay: ".7s" }}
        >
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <MessageCircle className="h-6 w-6 text-amber-200" />
          </div>
          <div className="flex-1 text-left">
            <p className="nature-title font-medium">Message the world...</p>
            <p className="text-xs nature-sub">Select a conversation</p>
          </div>
          <Send className="h-5 w-5 text-amber-200" />
        </button>
      </div>
    </div>
  );
}