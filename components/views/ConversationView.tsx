"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, Send, Smile, MoreVertical,
  Paperclip, DollarSign, Sparkles, Loader2,
  Pin, Trash2, UserPlus
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
  activeChatId: string;
  activeChatName: string;
  messages: Message[];
  userId: string;
  draft: string;
  setDraft: (draft: string) => void;
  onSendMessage: () => void;
  onSendMoney: () => void;
  onAISummary: () => void;
  aiSummary: string | null;
  onDeleteChat?: (chatId: string) => void;
  onPinChat?: (chatId: string) => void;
  onPinContact?: (contactId: string) => void;
  isPinned?: boolean;
  isContactPinned?: boolean;
}

export function ConversationView({
  setView,
  activeChatId,
  activeChatName,
  messages,
  userId,
  draft,
  setDraft,
  onSendMessage,
  onSendMoney,
  onAISummary,
  aiSummary,
  onDeleteChat,
  onPinChat,
  onPinContact,
  isPinned = false,
  isContactPinned = false,
}: ConversationViewProps) {
  const supabase = createClient();
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [typing, setTyping] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>(messages);
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const optionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getOtherUser = async () => {
      try {
        if (!activeChatId) return;
        
        const { data: members } = await supabase
          .from("chat_members")
          .select("user_id")
          .eq("chat_id", activeChatId);

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

    if (activeChatId) {
      getOtherUser();
    }
  }, [activeChatId, userId]);

  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  useEffect(() => {
    setIsOnline(Math.random() > 0.3);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSend = () => {
    if (!draft.trim()) return;
    onSendMessage();
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

  const handleDeleteChat = () => {
    if (onDeleteChat) {
      onDeleteChat(activeChatId);
    }
    setShowDeleteConfirm(false);
    setView("list");
  };

  const handlePinChat = () => {
    if (onPinChat) {
      onPinChat(activeChatId);
    }
    setShowOptions(false);
  };

  const handlePinContact = () => {
    if (onPinContact && otherUser) {
      onPinContact(otherUser.id);
    }
    setShowOptions(false);
  };

  const handleImageClick = (url: string | null) => {
    if (url) {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="conversation-wrap">
      <NatureBackground />

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
              {isContactPinned && (
                <span className="absolute -top-1 -right-1 text-[10px]">📌</span>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-[#FFF5E6] flex items-center gap-1">
                {otherUser?.display_name || activeChatName || "User"}
                {isContactPinned && <Pin className="h-3 w-3 text-[#FFD700]" />}
              </p>
              <p className="text-[10px] text-[rgba(255,245,230,0.4)]">
                {isOnline ? "Online" : "Offline"}
                {isPinned && " · 📌 Pinned"}
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

          <div className="relative" ref={optionsRef}>
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <MoreVertical className="h-5 w-5 text-[#FFF5E6]" />
            </button>

            {showOptions && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-[#0c140c] border border-[rgba(255,215,0,0.15)] rounded-xl shadow-lg overflow-hidden z-50">
                <button
                  onClick={handlePinChat}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-[#FFF5E6] hover:bg-white/5 transition-colors"
                >
                  <Pin className="h-4 w-4 text-[#FFD700]" />
                  {isPinned ? "Unpin Chat" : "Pin Chat"}
                </button>

                <button
                  onClick={handlePinContact}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-[#FFF5E6] hover:bg-white/5 transition-colors"
                >
                  <UserPlus className="h-4 w-4 text-[#00F0FF]" />
                  {isContactPinned ? "Unpin Contact" : "Pin Contact"}
                </button>

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-[#FF2D95] hover:bg-white/5 transition-colors border-t border-[rgba(255,255,255,0.05)]"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#0c140c] border border-[rgba(255,215,0,0.2)] p-6">
            <h3 className="text-lg font-bold text-[#FFF5E6] mb-2">Delete Conversation?</h3>
            <p className="text-sm text-[rgba(255,245,230,0.6)] mb-6">
              This will delete the entire conversation for you. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 text-[#FFF5E6] font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChat}
                className="flex-1 py-3 rounded-xl bg-[#FF2D95] text-white font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {aiSummary && (
        <div className="mx-4 mt-2 p-3 rounded-xl bg-[rgba(255,215,0,0.08)] border border-[rgba(255,215,0,0.2)]">
          <p className="text-sm text-[#FFF5E6]">{aiSummary}</p>
        </div>
      )}

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
                    className={`flex items-end gap-2 mb-1 animate-messageIn ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
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

                    {/* Message bubble with RED for outgoing, GREEN for incoming */}
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                        isMine
                          ? "bg-gradient-to-r from-[#FF2D95] to-[#B026FF] text-white rounded-br-sm shadow-lg shadow-[rgba(255,45,149,0.2)]"
                          : "bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white rounded-bl-sm shadow-lg shadow-[rgba(34,197,94,0.2)]"
                      }`}
                    >
                      {msg.media_url && (
                        <img
                          src={msg.media_url}
                          className="max-w-full max-h-60 rounded-lg mb-1 cursor-pointer"
                          alt="Message attachment"
                          onClick={() => handleImageClick(msg.media_url)}
                        />
                      )}
                      {msg.text && <p className="text-sm break-words">{msg.text}</p>}
                      <p className={`text-[9px] mt-1 ${isMine ? "text-white/60" : "text-white/60"}`}>
                        {formatTime(msg.created_at)}
                        {isMine && (
                          <span className="ml-2">
                            {msg.status === "sent" ? "✓" : "✓✓"}
                          </span>
                        )}
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

          <button
            onClick={handleSend}
            disabled={!draft.trim()}
            className={`p-2 rounded-full transition-all ${
              draft.trim()
                ? "bg-gradient-to-r from-[#FFD700] to-[#00F0FF] text-black hover:scale-105 shadow-lg shadow-[rgba(255,215,0,0.2)]"
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