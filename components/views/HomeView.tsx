"use client";

import { MessageCircle, Send, User } from "lucide-react";
import { GChatMenu } from "../GChatMenu";

type View = "home" | "list" | "conversation" | "wallet" | "feed" | "gtribe" | "gchatone" | "profile" | "edit-profile" | "analytics" | "settings";

interface HomeViewProps {
  setView: (view: View) => void;
  onLogout: () => void;
}

export function HomeView({ setView }: HomeViewProps) {
  return (
    <div className="relative z-10 flex flex-col min-h-screen p-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-bold text-black text-xl">G</div>
          <span className="font-bold text-lg">G-Chat</span>
        </div>
        <button onClick={() => setView("profile")} className="p-2 rounded-full bg-white/5">
          <User className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {/* Hero */}
      <div className="text-center mb-8 mt-2">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-cyan-200 to-emerald-300 bg-clip-text text-transparent mb-2">
          One World. One App.
        </h1>
        <p className="text-base font-medium text-purple-400 mb-2">Infinite Possibilities.</p>
      </div>

      {/* NEW: Living animated ecosystem menu */}
      <GChatMenu onNavigate={setView} />

      <div className="flex-1" />

      {/* Message the world composer */}
      <button onClick={() => setView("list")} className="w-full p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 backdrop-blur-xl flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
          <MessageCircle className="h-6 w-6 text-cyan-400" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-white font-medium">Message the world...</p>
          <p className="text-xs text-gray-400">Select a conversation</p>
        </div>
        <Send className="h-5 w-5 text-cyan-400" />
      </button>
    </div>
  );
}