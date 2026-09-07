"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Users, MessageCircle, Search, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

type Chat = { id: string; name: string; created_at: string };
type View = "home" | "list" | "conversation" | "wallet" | "feed" | "gtribe" | "gchatone" | "profile" | "edit-profile" | "analytics" | "settings";

interface Props {
  setView: (v: View) => void;
  chats: Chat[];
  onOpenChat: (c: Chat) => void;
}

export function ChatsListView({ setView, chats, onOpenChat }: Props) {
  const supabase = createClient();
  const [me, setMe] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setMe(data.user.id);
    });
  }, []);

  // Search for users
  const searchUsers = async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
      .neq("id", me)
      .limit(10);
    setSearchResults(data || []);
    setLoading(false);
  };

  // Start a new chat
  const startChat = async (person: any) => {
    try {
      // Check if chat already exists
      const { data: existing } = await supabase
        .from("chat_members")
        .select("chat_id")
        .eq("user_id", me);

      let existingChatId = null;
      if (existing && existing.length > 0) {
        const chatIds = existing.map((m: any) => m.chat_id);
        const { data: other } = await supabase
          .from("chat_members")
          .select("chat_id")
          .in("chat_id", chatIds)
          .eq("user_id", person.id);
        if (other && other.length > 0) {
          existingChatId = other[0].chat_id;
        }
      }

      if (existingChatId) {
        const { data: chat } = await supabase
          .from("chats")
          .select("*")
          .eq("id", existingChatId)
          .single();
        if (chat) {
          onOpenChat(chat);
          setShowSearch(false);
          setSearchTerm("");
          setSearchResults([]);
          return;
        }
      }

      // Create new chat
      const { data: newChat, error } = await supabase
        .from("chats")
        .insert({
          name: `Chat with ${person.display_name || person.username}`,
          created_by: me
        })
        .select()
        .single();

      if (error || !newChat) {
        alert("Failed to create chat");
        return;
      }

      await supabase.from("chat_members").insert([
        { chat_id: newChat.id, user_id: me },
        { chat_id: newChat.id, user_id: person.id }
      ]);

      onOpenChat(newChat);
      setShowSearch(false);
      setSearchTerm("");
      setSearchResults([]);
    } catch (err) {
      console.error("Error starting chat:", err);
      alert("Failed to start chat");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1A0A]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0A1A0A]/90 backdrop-blur-xl border-b border-[rgba(255,215,0,0.1)] px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={() => setView("home")} className="p-2">
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Chats</h1>
          <button onClick={() => setShowSearch(!showSearch)} className="p-2">
            <Search className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="mt-2 flex gap-2">
            <input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                searchUsers(e.target.value);
              }}
              placeholder="Search by name or username..."
              className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white outline-none"
              autoFocus
            />
            <button onClick={() => { setShowSearch(false); setSearchTerm(""); setSearchResults([]); }} className="p-2">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        )}

        {/* Search Results */}
        {showSearch && searchResults.length > 0 && (
          <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
            {searchResults.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold">
                    {(p.display_name || p.username || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">{p.display_name || p.username}</p>
                    <p className="text-xs text-gray-400">@{p.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => startChat(p)}
                  className="px-3 py-1.5 rounded-lg bg-[#FFD700] text-black text-xs font-bold"
                >
                  Chat
                </button>
              </div>
            ))}
          </div>
        )}
        {showSearch && loading && (
          <p className="text-center text-gray-400 text-sm mt-2">Searching...</p>
        )}
      </div>

      {/* Chat List */}
      <div className="p-4 pb-24">
        {chats.length === 0 ? (
          <div className="text-center py-20">
            <MessageCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No conversations yet</p>
            <p className="text-sm text-gray-500 mt-1">Search for someone to start chatting</p>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onOpenChat(chat)}
              className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                {chat.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{chat.name}</p>
                <p className="text-xs text-gray-400">Tap to open</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}