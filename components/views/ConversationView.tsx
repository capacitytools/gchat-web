"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, Send, Image as ImageIcon, Mic, Smile, MoreVertical,
  Paperclip, Phone, Video, DollarSign, Sparkles, Loader2
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { NatureBackground } from "../NatureBackground";
import "./conversation.css";

type Message = {
  id: string;
  chat_id: string;
  user_id: string;
  text: string;
  media_url: string | null;
  created_at: string;
  status: string;
};

type Profile = {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
};

interface ConversationViewProps {
  setView: (view: any) => void;
  activeChatName: string;
  messages: Message[];
  userId: string;
  draft: string;
  setDraft: (draft: string) => void;
  onSendMessage: () => void;
  onSendMoney: () => void;
  onAISummary: () => void;
  aiSummary: string | null;
}

export function ConversationView({
  setView,
  activeChatName,
  messages,
  userId,
  draft,
  setDraft,
  onSendMessage,
  onSendMoney,
  onAISummary,
  aiSummary,
}: ConversationViewProps) {
  const supabase = createClient();
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [typing, setTyping] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>(messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get other user's profile
  useEffect(() => {
    const getOtherUser = async () => {
      try {
        // Get current chat members
        const { data: members } = await supabase
          .from("chat_members")
          .select("user_id")
          .eq("chat_id", messages[0]?.chat_id || "");

        if (members) {
          const otherUserId = members.find((m: any) => m.user_id !== userId)?.user_id;
          if (otherUserId) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, display_name, username, avatar_url")
              .eq("id", otherUserId)
              .single();
            setOtherUser(profile);
          }
        }
      } catch (err) {
        console.error("Error fetching other user:", err);
      } finally {
        setIsLoading(false);
      }
    };

    getOtherUser();
  }, [messages, userId]);

  // Update local messages when prop changes
  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  // Simulate online status (random for demo)
  useEffect(() => {
    setIsOnline(Math.random() > 0.3);
  }, []);

  const handleSend = () => {
    if (!draft.trim()) return;
    onSendMessage();
    // Simulate typing indicator
    setTyping(true);
    setTimeout(() => setTyping(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isToday = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  let currentDate = "";

  localMessages.forEach((msg) => {
    const dateKey = new Date(msg.created_at).toDateString();
    if (dateKey !== currentDate) {
      currentDate = dateKey;
      groupedMessages.push({
        date: dateKey,
        messages: [],
      });
    }
    groupedMessages[groupedMessages.length - 1].messages.push(msg);
  });

  // --- Message Sending (Will be handled by parent) ---
  // The parent component (gchat-app.tsx) handles the actual send
  // This component just displays messages

  return (
    <div className="conversation-wrap">
      <NatureBackground />

      {/* Header */}
      <div className="conv-header">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView("list")}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-[#FFF5E6]" />
          </button>

          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-bold text-white overflow-hidden">
                {otherUser?.avatar_url ? (
                  <img src={otherUser.avatar_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  (otherUser?.display_name || activeChatName || "U").charAt(0).toUpperCase()
                )}
              </div>
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0A1A0A]" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-[#FFF5E6]">
                {otherUser?.display_name || activeChatName || "User"}
              </p>
              <p className="text-[10px] text-[rgba(255,245,230,0.4)]">
                {isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onSendMoney}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <DollarSign className="h-5 w-5 text-emerald-400" />
          </button>
          <button
            onClick={onAISummary}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <Sparkles className="h-5 w-5 text-[#FFD700]" />
          </button>
          <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <MoreVertical className="h-5 w-5 text-[#FFF5E6]" />
          </button>
        </div>
      </div>

      {/* AI Summary */}
      {aiSummary && (
        <div className="mx-4 mt-2 p-3 rounded-xl bg-[rgba(255,215,0,0.08)] border border-[rgba(255,215,0,0.2)]">
          <p className="text-sm text-[#FFF5E6]">{aiSummary}</p>
        </div>
      )}

      {/* Messages */}
      <div className="conv-messages">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-[#FFD700]" />
          </div>
        ) : localMessages.length === 0 ? (
          <div className="text-center py-20 text-[rgba(255,245,230,0.5)]">
            <p className="text-lg mb-2">💬 No messages yet</p>
            <p className="text-sm">Say hello to start the conversation!</p>
          </div>
        ) : (
          groupedMessages.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Date divider */}
              <div className="flex justify-center my-4">
                <span className="text-[10px] px-3 py-1 rounded-full bg-[rgba(255,255,255,0.05)] text-[rgba(255,245,230,0.4)] border border-[rgba(255,255,255,0.06)]">
                  {isToday(group.date) ? "Today" : formatDate(group.date)}
                </span>
              </div>

              {group.messages.map((msg, index) => {
                const isMine = msg.user_id === userId;
                const showAvatar = !isMine && (index === 0 || group.messages[index - 1]?.user_id !== msg.user_id);

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 mb-1 ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    {!isMine && showAvatar && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-bold text-white text-xs overflow-hidden flex-shrink-0">
                        {otherUser?.avatar_url ? (
                          <img src={otherUser.avatar_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          (otherUser?.display_name || "U").charAt(0).toUpperCase()
                        )}
                      </div>
                    )}
                    {!isMine && !showAvatar && <div className="w-8 flex-shrink-0" />}

                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                        isMine
                          ? "bg-gradient-to-r from-[#FFD700] to-[#00F0FF] text-black rounded-br-sm"
                          : "bg-[rgba(255,255,255,0.06)] text-[#FFF5E6] rounded-bl-sm border border-[rgba(255,255,255,0.06)]"
                      }`}
                    >
                      {msg.media_url && (
                        <img
                          src={msg.media_url}
                          className="max-w-full max-h-60 rounded-lg mb-1 cursor-pointer"
                          alt="Message attachment"
                          onClick={() => window.open(msg.media_url, "_blank")}
                        />
                      )}
                      {msg.text && <p className="text-sm break-words">{msg.text}</p>}
                      <p className={`text-[9px] mt-1 ${isMine ? "text-black/60" : "text-[rgba(255,245,230,0.4)]"}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>

                    {isMine && <div className="w-8 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typing && (
        <div className="px-4 py-1">
          <div className="flex items-center gap-2 text-[rgba(255,245,230,0.4)] text-xs">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white text-[8px] font-bold">
              {otherUser?.display_name?.charAt(0) || "U"}
            </div>
            <span>typing</span>
            <span className="flex gap-0.5">
              <span className="w-1 h-1 bg-[rgba(255,245,230,0.4)] rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
              <span className="w-1 h-1 bg-[rgba(255,245,230,0.4)] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              <span className="w-1 h-1 bg-[rgba(255,245,230,0.4)] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
            </span>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="conv-input">
        <div className="flex items-center gap-2 bg-[rgba(255,255,255,0.05)] rounded-full px-4 py-1.5 border border-[rgba(255,255,255,0.06)] flex-1">
          <button className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
            <Smile className="h-5 w-5 text-[rgba(255,245,230,0.4)]" />
          </button>

          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-transparent outline-none text-[#FFF5E6] text-sm placeholder-[rgba(255,245,230,0.3)] py-2"
          />

          <button className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
            <Paperclip className="h-5 w-5 text-[rgba(255,245,230,0.4)]" />
          </button>

          <button className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
            <Mic className="h-5 w-5 text-[rgba(255,245,230,0.4)]" />
          </button>

          <button
            onClick={handleSend}
            disabled={!draft.trim()}
            className={`p-2 rounded-full transition-all ${
              draft.trim()
                ? "bg-gradient-to-r from-[#FFD700] to-[#00F0FF] text-black hover:scale-105"
                : "bg-[rgba(255,255,255,0.05)] text-[rgba(255,245,230,0.3)] cursor-not-allowed"
            }`}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}