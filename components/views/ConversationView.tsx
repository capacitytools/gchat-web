"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

type Message = {
  id: string;
  chat_id: string;
  user_id: string;
  text: string;
  created_at: string;
};

type Chat = { id: string; name: string };

interface Props {
  setView: (view: any) => void;
  chat: Chat;
  userId: string;
}

export function ConversationView({ setView, chat, userId }: Props) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [otherUser, setOtherUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  // Load messages
  useEffect(() => {
    if (!chat.id) return;

    const loadMessages = async () => {
      setLoading(true);
      // Get other user
      const { data: members } = await supabase
        .from("chat_members")
        .select("user_id")
        .eq("chat_id", chat.id);

      if (members) {
        const otherId = members.find((m: any) => m.user_id !== userId)?.user_id;
        if (otherId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, username, avatar_url")
            .eq("id", otherId)
            .single();
          setOtherUser(profile);
        }
      }

      // Get messages
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chat.id)
        .order("created_at", { ascending: true });

      setMessages(data || []);
      setLoading(false);
    };

    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${chat.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chat.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chat.id, userId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!draft.trim()) return;

    const { data, error } = await supabase
      .from("messages")
      .insert({
        chat_id: chat.id,
        user_id: userId,
        text: draft.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) => [...prev, data]);
      setDraft("");
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col h-screen bg-[#0A1A0A]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0A1A0A]/90 backdrop-blur-xl border-b border-[rgba(255,215,0,0.1)] px-4 py-3 flex items-center gap-3">
        <button onClick={() => setView("list")} className="p-2">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <div className="flex-1">
          <p className="text-white font-bold">{chat.name}</p>
          <p className="text-xs text-gray-400">
            {otherUser?.display_name || otherUser?.username || "User"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="text-center text-gray-400 py-20">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 py-20">
            <p>No messages yet</p>
            <p className="text-sm">Say hello!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMine = msg.user_id === userId;
            const showDate = i === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[i - 1].created_at).toDateString();

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="text-center my-4">
                    <span className="text-xs px-3 py-1 rounded-full bg-white/5 text-gray-400 border border-white/5">
                      {formatDate(msg.created_at)}
                    </span>
                  </div>
                )}
                <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                      isMine
                        ? "bg-gradient-to-r from-[#FFD700] to-[#00F0FF] text-black rounded-br-sm"
                        : "bg-white/10 text-white rounded-bl-sm"
                    }`}
                  >
                    <p className="text-sm break-words">{msg.text}</p>
                    <p className={`text-[9px] mt-1 ${isMine ? "text-black/60" : "text-gray-400"}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-[#0A1A0A]/90 backdrop-blur-xl border-t border-[rgba(255,215,0,0.1)] p-4">
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-white outline-none placeholder-gray-500"
          />
          <button
            onClick={sendMessage}
            disabled={!draft.trim()}
            className={`p-2.5 rounded-full ${
              draft.trim()
                ? "bg-gradient-to-r from-[#FFD700] to-[#00F0FF] text-black"
                : "bg-white/5 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}