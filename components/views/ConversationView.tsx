"use client";

import { useRef, useState } from "react";
import { ArrowLeft, Sparkles, CreditCard, Paperclip, Send } from "lucide-react";
import { format } from "date-fns";

type View = "home" | "list" | "conversation" | "wallet" | "feed" | "gtribe" | "gchatone" | "profile" | "edit-profile" | "analytics" | "settings";
type Message = { id: string; chat_id: string; user_id: string; text: string; media_url: string | null; created_at: string; status: string; };

interface ConversationViewProps {
  setView: (view: View) => void;
  activeChatName: string;
  messages: Message[];
  userId: string;
  draft: string;
  setDraft: (d: string) => void;
  onSendMessage: () => void;
  onSendMoney: () => void;
  onAISummary: () => void;
  aiSummary: string | null;
}

export function ConversationView({
  setView, activeChatName, messages, userId, draft, setDraft, onSendMessage, onSendMoney, onAISummary, aiSummary
}: ConversationViewProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="relative z-10 flex flex-col min-h-screen">
      <header className="sticky top-0 z-20 bg-[#020617]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button onClick={() => setView("list")} className="p-2 -ml-2 rounded-full hover:bg-white/5"><ArrowLeft className="h-5 w-5" /></button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center font-bold">{activeChatName.charAt(0).toUpperCase()}</div>
        <div className="flex-1">
          <h1 className="font-semibold text-white text-sm">{activeChatName}</h1>
          <p className="text-xs text-emerald-400">Online</p>
        </div>
        <button onClick={onAISummary} className="p-2 rounded-full hover:bg-white/5 text-purple-400"><Sparkles className="h-5 w-5" /></button>
      </header>
      {aiSummary && <div className="mx-4 mt-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-sm text-purple-200">{aiSummary}</div>}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        {messages.map((msg) => {
          const isOwn = msg.user_id === userId;
          return (
            <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-lg ${isOwn ? "bg-gradient-to-br from-emerald-600 to-cyan-700 text-white rounded-br-sm" : "bg-white/10 backdrop-blur-md border border-white/10 text-white rounded-bl-sm"}`}>
                {msg.text && <p className="text-[15px] whitespace-pre-wrap">{msg.text}</p>}
                <div className={`text-[10px] mt-1 flex justify-end ${isOwn ? "text-emerald-100" : "text-gray-400"}`}>{format(new Date(msg.created_at), "HH:mm")}</div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>
      <div className="fixed bottom-16 left-0 right-0 z-30 bg-[#020617]/95 backdrop-blur-xl border-t border-white/10 p-3 max-w-md mx-auto">
        <div className="flex items-center gap-2">
          <button onClick={onSendMoney} className="p-3 rounded-full bg-blue-500/10 text-blue-400 shrink-0"><CreditCard className="h-5 w-5" /></button>
          <button className="p-3 rounded-full bg-white/5 text-gray-400 shrink-0"><Paperclip className="h-5 w-5" /></button>
          <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl px-4 py-3">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSendMessage()} placeholder="Type..." className="w-full bg-transparent text-white outline-none" />
          </div>
          <button onClick={onSendMessage} className="p-3 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shrink-0"><Send className="h-5 w-5" /></button>
        </div>
      </div>
    </div>
  );
}