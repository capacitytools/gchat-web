"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, MessageCircle, Newspaper, Phone, Plus, Send, Wallet, LogOut, Image as ImageIcon, Loader2 } from "lucide-react";
import { GButton } from "@/components/gbutton";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { format } from "date-fns";

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
};

type Tab = "chats" | "feed" | "calls" | "wallet";

export function GChatApp() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("chats");
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  
  // Image Upload States
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newChatUsername, setNewChatUsername] = useState("");
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  // 1. Auth State Management
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
      } else {
        setUser(session.user);
      }
      setLoading(false);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // 2. Fetch Chats on Mount
  useEffect(() => {
    if (user) fetchChats();
  }, [user]);

  // 3. Fetch & Subscribe to Messages when Chat is Active
  useEffect(() => {
    if (activeChatId) {
      fetchMessages(activeChatId);
      const channel = supabase
        .channel(`chat:${activeChatId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${activeChatId}` },
          (payload) => {
            const newMsg = { ...(payload.new as any), status: "delivered" as const };
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        )
        .subscribe();
      return () => {        supabase.removeChannel(channel);
      };
    }
  }, [activeChatId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const fetchChats = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("chat_members")
      .select("chat_id, chats(id, name, created_at)")
      .eq("user_id", user.id);
    
    if (!error && data) {
      const formatted = data.map((item: any) => ({
        id: item.chats.id,
        name: item.chats.name,
        updated_at: item.chats.created_at
      }));
      setChats(formatted);
    }
  };

  const fetchMessages = async (chatId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("id, chat_id, user_id, text, media_url, created_at")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });
    
    if (!error && data) {
      const formatted = data.map((msg) => ({ ...msg, status: "delivered" as const }));
      setMessages(formatted);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const localUrl = URL.createObjectURL(file);
      setSelectedImage(localUrl);
    }
  };

  const sendMessage = async () => {    if (!draft.trim() && !selectedFile) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      chat_id: activeChatId!,
      user_id: user.id,
      text: draft.trim(),
      media_url: selectedImage,
      created_at: new Date().toISOString(),
      status: "sending",
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setDraft("");
    setIsUploading(!!selectedFile);

    try {
      let finalMediaUrl = null;
      
      if (selectedFile) {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
        const compressedFile = await imageCompression(selectedFile, options);
        const fileExt = compressedFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("messages")
          .upload(fileName, compressedFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("messages").getPublicUrl(uploadData.path);
        finalMediaUrl = urlData.publicUrl;
      }

      const { data, error } = await supabase
        .from("messages")
        .insert({
          chat_id: activeChatId,
          user_id: user.id,
          text: optimisticMsg.text,
          media_url: finalMediaUrl,
        })
        .select()
        .single();

      if (error) throw error;

      setMessages((prev) =>        prev.map((msg) => (msg.id === tempId ? { ...msg, id: data.id, status: "sent", media_url: finalMediaUrl } : msg))
      );
    } catch (error) {
      console.error("Failed to send:", error);
      alert("Failed to send. Check your connection or storage bucket.");
    } finally {
      setIsUploading(false);
      setSelectedImage(null);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const createChat = async () => {
    if (!user || !newChatUsername.trim()) return;
    
    const { data: targetProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .eq("username", newChatUsername.trim())
      .single();

    if (profileError || !targetProfile) {
      alert("User not found. Check the exact username.");
      return;
    }

    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .insert({ name: `Chat with ${targetProfile.display_name}`, created_by: user.id })
      .select()
      .single();

    if (chatError || !chat) {
      alert("Failed to create chat.");
      return;
    }

    await supabase.from("chat_members").insert([
      { chat_id: chat.id, user_id: user.id, role: "owner" },
      { chat_id: chat.id, user_id: targetProfile.id, role: "member" }
    ]);

    setShowNewChatModal(false);
    setNewChatUsername("");
    fetchChats();
    setActiveChatId(chat.id);
  };

  const handleLogout = async () => {    await supabase.auth.signOut();
    router.push("/auth");
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gbackground dark:bg-gdark-background text-gmuted">Loading G-Chat...</div>;
  }

  if (!user) return null;

  const activeChat = chats.find((c) => c.id === activeChatId);
  const showChatList = tab === "chats" && !activeChat;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-gbackground dark:bg-gdark-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-gborder bg-white/95 px-4 py-3 backdrop-blur dark:border-gdark-border dark:bg-gdark-surface/95">
        {tab === "chats" && activeChat ? (
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveChatId(null)} className="rounded-full p-2 hover:bg-gborder/40 dark:hover:bg-gdark-border/40">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ggreen-primary/10 font-heading font-semibold text-ggreen-primary">
              {activeChat.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-heading text-lg font-semibold leading-6">{activeChat.name}</h1>
              <p className="text-xs text-gmuted dark:text-gdark-muted">Online</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-xl font-semibold">G-Chat</h1>
            <button onClick={handleLogout} className="rounded-full p-2 text-gmuted hover:bg-gerror/10 hover:text-gerror">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {tab === "chats" && activeChat ? (
          <section className="flex min-h-full flex-col justify-end gap-3 p-4 pb-40">
            {messages.map((msg) => {
              const isOwn = msg.user_id === user.id;
              return (
                <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-gbubble px-4 py-3 shadow-sm ${isOwn ? "bg-ggreen-primary text-white" : "bg-glight-bubble text-gtext dark:bg-gdark-bubble dark:text-gdark-text"}`}>
                    {msg.media_url && <img src={msg.media_url} alt="Attachment" className="rounded-lg mb-2 max-w-full h-auto" />}                    {msg.text && <p className="whitespace-pre-wrap break-words text-[15px]">{msg.text}</p>}
                    <div className={`flex items-center justify-end gap-1 mt-1 text-[11px] ${isOwn ? "text-white/80" : "text-gmuted dark:text-gdark-muted"}`}>
                      <span>{format(new Date(msg.created_at), "HH:mm")}</span>
                      {isOwn && (
                        <span>
                          {msg.status === "sending" && <Loader2 className="h-3 w-3 animate-spin" />}
                          {msg.status === "sent" && "✓"}
                          {msg.status === "delivered" && "✓✓"}
                          {msg.status === "read" && <span className="text-gblue-primary">✓✓</span>}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </section>
        ) : null}

        {showChatList && (
          <section className="p-4 pb-36">
            {chats.length === 0 ? (
              <div className="rounded-gcard border border-gborder bg-white p-6 text-center dark:border-gdark-border dark:bg-gdark-surface">
                <h2 className="font-heading text-lg font-semibold">Start your first chat</h2>
                <p className="mt-2 text-sm text-gmuted dark:text-gdark-muted">Tap the green button below to find a user by username.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {chats.map((chat) => (
                  <button key={chat.id} onClick={() => setActiveChatId(chat.id)} className="w-full rounded-gcard border border-gborder bg-white p-3 text-left hover:border-ggreen-primary/50 dark:border-gdark-border dark:bg-gdark-surface">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ggreen-primary/10 font-heading font-semibold text-ggreen-primary">
                        {chat.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{chat.name}</p>
                        <p className="truncate text-sm text-gmuted dark:text-gdark-muted">Tap to open chat</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {tab !== "chats" && (
          <section className="p-4 pb-36">
            <div className="rounded-gcard border border-gborder bg-white p-6 dark:border-gdark-border dark:bg-gdark-surface">              <h2 className="font-heading text-lg font-semibold capitalize">{tab}</h2>
              <p className="mt-2 text-sm text-gmuted dark:text-gdark-muted">This feature is coming in the next build phase.</p>
            </div>
          </section>
        )}
      </main>

      {/* Image Preview Area */}
      {selectedImage && (
        <div className="px-4 py-2 bg-gbackground dark:bg-gdark-background border-t border-gborder">
          <div className="relative inline-block">
            <img src={selectedImage} alt="Preview" className="h-20 rounded-lg border border-gborder" />
            <button 
              onClick={() => { setSelectedImage(null); setSelectedFile(null); }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Composer / Bottom Bar */}
      {tab === "chats" && activeChat && (
        <footer className="fixed inset-x-0 bottom-16 z-20 border-t border-gborder bg-white/95 p-3 backdrop-blur dark:border-gdark-border dark:bg-gdark-surface/95">
          <div className="mx-auto flex w-full max-w-md items-end gap-2">
            
            {/* GIANT YELLOW CAMERA BUTTON */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-12 w-24 items-center justify-center rounded-lg bg-yellow-400 text-black font-bold text-sm mr-1 shrink-0"
            >
              CAMERA
            </button>
            
            {/* HIDDEN FILE INPUT */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />

            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Message"
              rows={1}
              className="max-h-32 min-h-[48px] flex-1 resize-y rounded-gbutton border border-gborder bg-white px-4 py-3 text-[15px] outline-none focus:border-ggreen-primary dark:border-gdark-border dark:bg-gdark-surface"
            />
            <button
              onClick={sendMessage}
              disabled={(!draft.trim() && !selectedFile) || isUploading}
              className="flex h-12 w-12 items-center justify-center rounded-gbutton bg-ggreen-primary text-white active:bg-ggreen-deep disabled:opacity-50 shrink-0"
            >
              {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </div>
        </footer>
      )}

      {/* Floating Action Button */}
      {showChatList && (
        <button
          onClick={() => setShowNewChatModal(true)}
          className="fixed right-4 bottom-20 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-ggreen-primary text-white shadow-lg shadow-ggreen-primary/30 active:bg-ggreen-deep"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-gcard border border-gborder bg-white p-6 dark:border-gdark-border dark:bg-gdark-surface">
            <h3 className="font-heading text-lg font-semibold">New Chat</h3>
            <p className="mt-1 text-sm text-gmuted dark:text-gdark-muted">Enter the exact username of the person you want to chat with.</p>
            <input
              type="text"
              value={newChatUsername}
              onChange={(e) => setNewChatUsername(e.target.value)}
              placeholder="username"
              className="mt-4 w-full rounded-gbutton border border-gborder bg-white px-4 py-3 text-[15px] outline-none focus:border-ggreen-primary dark:border-gdark-border dark:bg-gdark-surface"
              autoFocus
            />
            <div className="mt-4 flex gap-2">
              <GButton onClick={() => setShowNewChatModal(false)} variant="deep" className="flex-1">Cancel</GButton>
              <GButton onClick={createChat} className="flex-1">Create</GButton>
            </div>
          </div>
        </div>
      )}
      {/* Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-gborder bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-gdark-border dark:bg-gdark-surface/95">
        <div className="mx-auto grid h-16 w-full max-w-md grid-cols-4 items-center px-2">
          <TabButton active={tab === "chats"} label="Chats" onClick={() => { setTab("chats"); setActiveChatId(null); }} icon={<MessageCircle className="h-5 w-5" />} />
          <TabButton active={tab === "feed"} label="Feed" onClick={() => setTab("feed")} icon={<Newspaper className="h-5 w-5" />} />
          <TabButton active={tab === "calls"} label="Calls" onClick={() => setTab("calls")} icon={<Phone className="h-5 w-5" />} />
          <TabButton active={tab === "wallet"} label="Wallet" onClick={() => setTab("wallet")} icon={<Wallet className="h-5 w-5" />} />
        </div>
      </nav>
    </div>
  );
}

function TabButton({ active, label, icon, onClick }: { active: boolean; label: string; icon: any; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 rounded-lg px-2 py-1 text-xs ${active ? "text-gpurple-primary" : "text-gmuted dark:text-gdark-muted"}`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}