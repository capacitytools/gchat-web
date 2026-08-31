"use client";

import { ArrowLeft, Shield, Bell, Palette, Bot, Lock, LogOut } from "lucide-react";

type View = "home" | "list" | "conversation" | "wallet" | "feed" | "gtribe" | "gchatone" | "profile" | "edit-profile" | "analytics" | "settings";

interface SettingsViewProps {
  setView: (view: View) => void;
  onLogout: () => void;
}

export function SettingsView({ setView, onLogout }: SettingsViewProps) {
  return (
    <div className="relative z-10 flex flex-col min-h-screen pb-24">
      <header className="sticky top-0 z-20 bg-[#020617]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button onClick={() => setView("profile")} className="p-2 rounded-full bg-white/5"><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-xl font-bold">Settings</h1>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <button className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 text-left"><Shield className="h-5 w-5 text-cyan-400" /><div className="flex-1"><p className="font-medium">Privacy</p><p className="text-xs text-gray-400">Read receipts, online status</p></div></button>
        <button className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 text-left"><Bell className="h-5 w-5 text-purple-400" /><div className="flex-1"><p className="font-medium">Notifications</p><p className="text-xs text-gray-400">Messages, calls, rewards</p></div></button>
        <button className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 text-left"><Palette className="h-5 w-5 text-pink-400" /><div className="flex-1"><p className="font-medium">Appearance</p><p className="text-xs text-gray-400">Themes, chat colors</p></div></button>
        <button className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 text-left"><Bot className="h-5 w-5 text-emerald-400" /><div className="flex-1"><p className="font-medium">AI Assistant</p><p className="text-xs text-gray-400">Smart replies, summaries</p></div></button>
        <button className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 text-left"><Lock className="h-5 w-5 text-yellow-400" /><div className="flex-1"><p className="font-medium">Security</p><p className="text-xs text-gray-400">2FA, secret chats</p></div></button>
        <button onClick={onLogout} className="w-full flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-left mt-6"><LogOut className="h-5 w-5 text-red-400" /><div className="flex-1"><p className="font-medium text-red-400">Logout</p></div></button>
      </div>
    </div>
  );
}