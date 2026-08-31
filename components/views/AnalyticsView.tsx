"use client";

import { ArrowLeft, Eye, Heart, Send, Banknote, TrendingUp } from "lucide-react";

type View = "home" | "list" | "conversation" | "wallet" | "feed" | "gtribe" | "gchatone" | "profile" | "edit-profile" | "analytics" | "settings";
type UserProfile = { profile_views: number; posts_count: number; messages_sent: number; };

interface AnalyticsViewProps {
  setView: (view: View) => void;
  profile: UserProfile;
  walletBalance: number;
}

export function AnalyticsView({ setView, profile, walletBalance }: AnalyticsViewProps) {
  return (
    <div className="relative z-10 flex flex-col min-h-screen pb-24">
      <header className="sticky top-0 z-20 bg-[#020617]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button onClick={() => setView("profile")} className="p-2 rounded-full bg-white/5"><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-xl font-bold">Analytics</h1>
      </header>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
            <Eye className="h-6 w-6 text-cyan-400 mb-2" />
            <p className="text-2xl font-bold">{profile.profile_views || 0}</p>
            <p className="text-xs text-gray-400">Profile Views</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <Heart className="h-6 w-6 text-purple-400 mb-2" />
            <p className="text-2xl font-bold">{(profile.posts_count || 0) * 3}</p>
            <p className="text-xs text-gray-400">Total Likes</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30">
            <Send className="h-6 w-6 text-emerald-400 mb-2" />
            <p className="text-2xl font-bold">{profile.messages_sent || 0}</p>
            <p className="text-xs text-gray-400">Messages Sent</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
            <Banknote className="h-6 w-6 text-yellow-400 mb-2" />
            <p className="text-2xl font-bold">${(walletBalance / 100).toFixed(2)}</p>
            <p className="text-xs text-gray-400">Earned</p>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
          <h3 className="font-bold mb-3 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-cyan-400" /> Growth</h3>
          <div className="space-y-3">
            <div><div className="flex justify-between text-sm mb-1"><span>Profile Views</span><span className="text-cyan-400">+12%</span></div><div className="h-2 bg-white/10 rounded-full"><div className="h-2 bg-cyan-400 rounded-full" style={{width: '65%'}} /></div></div>
            <div><div className="flex justify-between text-sm mb-1"><span>Post Engagement</span><span className="text-purple-400">+8%</span></div><div className="h-2 bg-white/10 rounded-full"><div className="h-2 bg-purple-400 rounded-full" style={{width: '45%'}} /></div></div>
            <div><div className="flex justify-between text-sm mb-1"><span>Message Activity</span><span className="text-emerald-400">+23%</span></div><div className="h-2 bg-white/10 rounded-full"><div className="h-2 bg-emerald-400 rounded-full" style={{width: '78%'}} /></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}