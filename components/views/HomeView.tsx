"use client";

import { MessageCircle, Users, Wallet, Building2, Send, User, Users2, ImageIcon } from "lucide-react";

type View = "home" | "list" | "conversation" | "wallet" | "feed" | "gtribe" | "gchatone" | "profile" | "edit-profile" | "analytics" | "settings";

interface HomeViewProps {
  setView: (view: View) => void;
  onLogout: () => void;
}

export function HomeView({ setView, onLogout }: HomeViewProps) {
  return (
    <div className="relative z-10 flex flex-col min-h-screen p-6 pb-24">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-bold text-black text-xl">G</div>
          <span className="font-bold text-lg">G-Chat</span>
        </div>
        <button onClick={() => setView("profile")} className="p-2 rounded-full bg-white/5"><User className="h-5 w-5 text-gray-400" /></button>
      </div>
      <div className="text-center mb-10 mt-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-cyan-200 to-emerald-300 bg-clip-text text-transparent mb-2">One World. One App.</h1>
        <p className="text-lg font-medium text-purple-400 mb-4">Infinite Possibilities.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button onClick={() => setView("gtribe")} className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-left">
          <Users2 className="h-8 w-8 text-purple-400 mb-3" />
          <h3 className="font-bold">G-Tribe</h3>
          <p className="text-xs text-gray-400">Groups & Communities</p>
        </button>
        <button onClick={() => setView("wallet")} className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-left">
          <Wallet className="h-8 w-8 text-blue-400 mb-3" />
          <h3 className="font-bold">G-Pay</h3>
          <p className="text-xs text-gray-400">Wallet & Earn</p>
        </button>
        <button onClick={() => setView("gchatone")} className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-left">
          <Building2 className="h-8 w-8 text-emerald-400 mb-3" />
          <h3 className="font-bold">G-Chat One</h3>
          <p className="text-xs text-gray-400">Business & AI</p>
        </button>
        <button onClick={() => setView("feed")} className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-left">
          <ImageIcon className="h-8 w-8 text-orange-400 mb-3" />
          <h3 className="font-bold">G-Feed</h3>
          <p className="text-xs text-gray-400">Social Posts</p>
        </button>
      </div>
      <div className="flex-1" />
      <button onClick={() => setView("list")} className="w-full p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 backdrop-blur-xl flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"><MessageCircle className="h-6 w-6 text-cyan-400" /></div>
        <div className="flex-1 text-left"><p className="text-white font-medium">Message the world...</p><p className="text-xs text-gray-400">Select a conversation</p></div>
        <Send className="h-5 w-5 text-cyan-400" />
      </button>
    </div>
  );
}