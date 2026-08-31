"use client";

import { ArrowLeft, Plus } from "lucide-react";

type View = "home" | "list" | "conversation" | "wallet" | "feed" | "gtribe" | "gchatone" | "profile" | "edit-profile" | "analytics" | "settings";
type Chat = { id: string; name: string; updated_at: string; };

interface ChatsListViewProps {
  setView: (view: View) => void;
  chats: Chat[];
  onOpenChat: (chat: Chat) => void;
  onNewChat: () => void;
}

export function ChatsListView({ setView, chats, onOpenChat, onNewChat }: ChatsListViewProps) {
  return (
    <div className="relative z-10 flex flex-col min-h-screen pb-24">
      <header className="sticky top-0 z-20 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("home")} className="p-2 -ml-2 rounded-full hover:bg-white/5"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-xl font-bold">Chats</h1>
        </div>
        <button onClick={onNewChat} className="p-2 rounded-full bg-emerald-500/20 text-emerald-400"><Plus className="h-5 w-5" /></button>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {chats.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p>No chats yet. Start a new conversation!</p>
          </div>
        ) : chats.map((chat) => (
          <button key={chat.id} onClick={() => onOpenChat(chat)} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 text-left">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center font-bold">{chat.name.charAt(0).toUpperCase()}</div>
            <div className="flex-1 border-b border-white/5 pb-3">
              <h3 className="font-medium text-white">{chat.name}</h3>
              <p className="text-xs text-gray-500">Tap to open</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}