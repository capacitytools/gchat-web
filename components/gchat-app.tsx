"use client";

import { useEffect, useRef, useState } from "react";
import { 
  ArrowLeft, MessageCircle, Users, Wallet, Smartphone, Send, LogOut, 
  Loader2, Smile, Paperclip, Camera, Plus, Search, Phone, Video, MoreVertical,
  Sparkles, Globe, Shield, Zap
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { format } from "date-fns";
import { GChatBackground } from "./GChatBackground";

type Message = {
  id: string;
  chat_id: string;
  user_id: string;
  text: string;
  media_url: string | null;
  created_at: string;
  status: "sending" | "sent" | "delivered" | "read";
};

type Chat = {
  id: string;
  name: string;
  updated_at: string;
  last_message?: string;
};

type View = "home" | "list" | "conversation";

export function GChatApp() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [view, setView] = useState<View>("home");
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatName, setActiveChatName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState<string | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);  const [newChatUsername, setNewChatUsername] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // --- AUTH & DATA FETCHING ---
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push("/auth");
      else setUser(session.user);
      setLoading(false);
    };
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push("/auth");
      else setUser(session.user);
    });
    return () => { authListener.subscription.unsubscribe(); };
  }, [router]);

  useEffect(() => { if (user && view !== "home") fetchChats(); }, [user, view]);

  useEffect(() => {
    if (activeChatId) {
      fetchMessages(activeChatId);
      const channel = supabase
        .channel(`chat:${activeChatId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${activeChatId}` }, (payload) => {
          const newMsg = { ...(payload.new as any), status: "delivered" as const };
          setMessages((prev) => prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]);
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [activeChatId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const fetchChats = async () => {
    if (!user) return;
    const { data } = await supabase.from("chat_members").select("chat_id, chats(id, name, created_at)").eq("user_id", user.id);
    if (data) setChats(data.map((item: any) => ({ id: item.chats.id, name: item.chats.name, updated_at: item.chats.created_at })));
  };

  const fetchMessages = async (chatId: string) => {
    const { data } = await supabase.from("messages").select("id, chat_id, user_id, text, media_url, created_at").eq("chat_id", chatId).order("created_at", { ascending: true });
    if (data) setMessages(data.map((msg) => ({ ...msg, status: "delivered" as const })));
  };
  // --- ACTIONS ---
  const sendMessage = async () => {
    if (!draft.trim() && !selectedFile) return;
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = { id: tempId, chat_id: activeChatId!, user_id: user.id, text: draft.trim(), media_url: null, created_at: new Date().toISOString(), status: "sending" };

    setMessages((prev) => [...prev, optimisticMsg]);
    setDraft("");
    setIsUploading(!!selectedFile);

    try {
      let finalMediaUrl = null;
      if (selectedFile) {
        const compressedFile = await imageCompression(selectedFile, { maxSizeMB: 1, maxWidthOrHeight: 1920 });
        const fileName = `${user.id}/${Date.now()}.${compressedFile.name.split(".").pop()}`;
        const { data: uploadData } = await supabase.storage.from("messages").upload(fileName, compressedFile);
        if (uploadData) {
          const { data: urlData } = supabase.storage.from("messages").getPublicUrl(uploadData.path);
          finalMediaUrl = urlData.publicUrl;
        }
      }

      const { data } = await supabase.from("messages").insert({ chat_id: activeChatId, user_id: user.id, text: optimisticMsg.text, media_url: finalMediaUrl }).select().single();
      if (data) setMessages((prev) => prev.map((msg) => (msg.id === tempId ? { ...msg, id: data.id, status: "sent", media_url: finalMediaUrl } : msg)));
    } catch (error) {
      alert("Failed to send.");
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
    }
  };

  const createChat = async () => {
    if (!user || !newChatUsername.trim()) return;
    const { data: targetProfile } = await supabase.from("profiles").select("id, username, display_name").eq("username", newChatUsername.trim()).single();
    if (!targetProfile) { alert("User not found."); return; }
    
    const { data: chat } = await supabase.from("chats").insert({ name: `Chat with ${targetProfile.display_name}`, created_by: user.id }).select().single();
    if (!chat) { alert("Failed to create chat."); return; }
    
    await supabase.from("chat_members").insert([
      { chat_id: chat.id, user_id: user.id, role: "owner" },
      { chat_id: chat.id, user_id: targetProfile.id, role: "member" }
    ]);
    
    setShowNewChatModal(false);
    setNewChatUsername("");
    fetchChats();
    setActiveChatId(chat.id);
    setActiveChatName(chat.name);    setView("conversation");
  };

  const openChat = (chat: Chat) => {
    setActiveChatId(chat.id);
    setActiveChatName(chat.name);
    setView("conversation");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>;
  if (!user) return null;

  // --- RENDER VIEWS ---
  return (
    <div className="relative min-h-screen w-full max-w-md mx-auto text-white overflow-hidden font-sans">
      <GChatBackground />

      {/* ================= HOME VIEW ================= */}
      {view === "home" && (
        <div className="relative z-10 flex flex-col min-h-screen p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-bold text-black text-xl shadow-lg shadow-emerald-500/20">G</div>
              <span className="font-bold text-lg tracking-tight">G-Chat</span>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"><LogOut className="h-5 w-5 text-gray-400" /></button>
          </div>

          {/* Hero */}
          <div className="text-center mb-10 mt-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-cyan-200 to-emerald-300 bg-clip-text text-transparent mb-2">One World. One App.</h1>
            <p className="text-lg font-medium text-purple-400 mb-4">Infinite Possibilities.</p>
            <p className="text-sm text-gray-400">Chat Smarter. Live Better. Earn Together.</p>
          </div>

          {/* Ecosystem Cards */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button onClick={() => setShowComingSoon("G-Tribe")} className="group relative p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all text-left overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-500/30 transition-all" />
              <Users className="h-8 w-8 text-purple-400 mb-3 relative z-10" />
              <h3 className="font-bold text-white relative z-10">G-Tribe</h3>
              <p className="text-xs text-gray-400 relative z-10">Build. Share. Grow.</p>
            </button>
            
            <button onClick={() => setShowComingSoon("G-Pay")} className="group relative p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all text-left overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/30 transition-all" />
              <Wallet className="h-8 w-8 text-blue-400 mb-3 relative z-10" />
              <h3 className="font-bold text-white relative z-10">G-Pay</h3>
              <p className="text-xs text-gray-400 relative z-10">Send. Save. Cashout.</p>            </button>

            <button onClick={() => setShowComingSoon("G-Chat one")} className="group relative p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all text-left overflow-hidden col-span-2">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 rounded-xl bg-emerald-500/20"><Smartphone className="h-6 w-6 text-emerald-400" /></div>
                <div className="text-left">
                  <h3 className="font-bold text-white">G-Chat one</h3>
                  <p className="text-xs text-gray-400">One App. All You Need.</p>
                </div>
              </div>
            </button>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Message the World Composer */}
          <button 
            onClick={() => setView("list")}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 backdrop-blur-xl flex items-center gap-4 hover:from-cyan-500/20 hover:to-purple-500/20 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Globe className="h-6 w-6 text-cyan-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-medium">Message the world...</p>
              <p className="text-xs text-gray-400">Select a conversation to start</p>
            </div>
            <Send className="h-5 w-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {/* ================= CHAT LIST VIEW ================= */}
      {view === "list" && (
        <div className="relative z-10 flex flex-col min-h-screen">
          <header className="sticky top-0 z-20 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setView("home")} className="p-2 -ml-2 rounded-full hover:bg-white/5"><ArrowLeft className="h-5 w-5" /></button>
              <h1 className="text-xl font-bold">Chats</h1>
            </div>
            <button onClick={() => setShowNewChatModal(true)} className="p-2 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"><Plus className="h-5 w-5" /></button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {chats.length === 0 ? (
              <div className="text-center py-20">
                <MessageCircle className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300">Your conversations start here</h3>                <p className="text-sm text-gray-500 mt-2">Tap + to connect with someone.</p>
              </div>
            ) : (
              chats.map((chat) => (
                <button key={chat.id} onClick={() => openChat(chat)} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors text-left">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center font-bold text-lg shrink-0 shadow-lg shadow-purple-500/20">
                    {chat.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 border-b border-white/5 pb-3">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-medium text-white truncate">{chat.name}</h3>
                      <span className="text-xs text-gray-500 shrink-0">{format(new Date(chat.updated_at), 'HH:mm')}</span>
                    </div>
                    <p className="text-sm text-gray-400 truncate">Tap to open chat</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= CONVERSATION VIEW ================= */}
      {view === "conversation" && activeChatId && (
        <div className="relative z-10 flex flex-col min-h-screen">
          <header className="sticky top-0 z-20 bg-[#020617]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3">
            <button onClick={() => setView("list")} className="p-2 -ml-2 rounded-full hover:bg-white/5"><ArrowLeft className="h-5 w-5" /></button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center font-bold shadow-lg shadow-purple-500/20">
              {activeChatName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="font-semibold text-white text-sm">{activeChatName}</h1>
              <p className="text-xs text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online</p>
            </div>
            <div className="flex gap-1">
              <button className="p-2 rounded-full hover:bg-white/5 text-gray-400"><Phone className="h-5 w-5" /></button>
              <button className="p-2 rounded-full hover:bg-white/5 text-gray-400"><Video className="h-5 w-5" /></button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
            {messages.map((msg) => {
              const isOwn = msg.user_id === user.id;
              return (
                <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-lg ${isOwn ? "bg-gradient-to-br from-emerald-600 to-cyan-700 text-white rounded-br-sm" : "bg-white/10 backdrop-blur-md border border-white/10 text-white rounded-bl-sm"}`}>
                    {msg.media_url && <img src={msg.media_url} className="rounded-lg mb-2 max-w-full border border-white/10" />}
                    {msg.text && <p className="text-[15px] whitespace-pre-wrap leading-relaxed">{msg.text}</p>}
                    <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isOwn ? "text-emerald-100" : "text-gray-400"}`}>
                      {format(new Date(msg.created_at), "HH:mm")}                      {isOwn && <span className="text-cyan-300 font-bold">✓✓</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </main>

          <footer className="fixed bottom-0 left-0 right-0 z-20 bg-[#020617]/90 backdrop-blur-xl border-t border-white/5 p-3 max-w-md mx-auto">
            <div className="flex items-end gap-2">
              <button onClick={() => fileInputRef.current?.click()} className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 transition-colors"><Paperclip className="h-5 w-5" /></button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if(f) setSelectedFile(f); }} />
              
              <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl px-4 py-3 flex items-center">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-[15px]"
                />
              </div>

              <button 
                onClick={sendMessage} 
                disabled={isUploading || (!draft.trim() && !selectedFile)}
                className="p-3 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all disabled:opacity-50 disabled:shadow-none"
              >
                {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </div>
          </footer>
        </div>
      )}

      {/* ================= MODALS ================= */}
      
      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[#0B1120] border border-white/10 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><Search className="h-5 w-5 text-cyan-400" /> New Chat</h3>
            <p className="text-sm text-gray-400 mb-4">Enter the exact username.</p>
            <input
              type="text"
              value={newChatUsername}
              onChange={(e) => setNewChatUsername(e.target.value)}
              placeholder="username"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-cyan-500/50 mb-4 transition-colors"              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setShowNewChatModal(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10">Cancel</button>
              <button onClick={createChat} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium shadow-lg shadow-emerald-500/20">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setShowComingSoon(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-[#0B1120] border border-white/10 p-8 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{showComingSoon}</h3>
            <p className="text-sm text-gray-400 mb-6">This feature is currently being built. Stay tuned for the next update!</p>
            <button onClick={() => setShowComingSoon(null)} className="w-full py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}