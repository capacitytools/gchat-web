"use client";

import { useEffect, useRef, useState } from "react";
import { 
  ArrowLeft, MessageCircle, Newspaper, Phone, Plus, Send, Wallet, LogOut, 
  Loader2, Smile, Paperclip, Camera, Mic, Image as ImageIcon, MapPin, 
  User, FileText, List, Calendar, Sparkles 
} from "lucide-react";
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
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [newChatUsername, setNewChatUsername] = useState("");
  const [showNewChatModal, setShowNewChatModal] = useState(false);

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
      if (!session) router.push("/auth");
      else setUser(session.user);
    });
    return () => { authListener.subscription.unsubscribe(); };
  }, [router]);

  // 2. Fetch Chats
  useEffect(() => { if (user) fetchChats(); }, [user]);

  // 3. Fetch & Subscribe to Messages
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

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ block: "end" }); }, [messages]);

  const fetchChats = async () => {
    if (!user) return;
    const { data } = await supabase.from("chat_members").select("chat_id, chats(id, name, created_at)").eq("user_id", user.id);
    if (data) setChats(data.map((item: any) => ({ id: item.chats.id, name: item.chats.name, updated_at: item.chats.created_at })));
  };
  const fetchMessages = async (chatId: string) => {
    const { data } = await supabase.from("messages").select("id, chat_id, user_id, text, media_url, created_at").eq("chat_id", chatId).order("created_at", { ascending: true });
    if (data) setMessages(data.map((msg) => ({ ...msg, status: "delivered" as const })));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedImage(URL.createObjectURL(file));
      setShowAttachmentMenu(false);
    }
  };

  const sendMessage = async () => {
    if (!draft.trim() && !selectedFile) return;
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = { id: tempId, chat_id: activeChatId!, user_id: user.id, text: draft.trim(), media_url: selectedImage, created_at: new Date().toISOString(), status: "sending" };

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
      setSelectedImage(null);
      setSelectedFile(null);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gdark-background text-white">Loading...</div>;
  if (!user) return null;
  const activeChat = chats.find((c) => c.id === activeChatId);
  const showChatList = tab === "chats" && !activeChat;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#0b141a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#1f2c34] px-4 py-3 flex items-center gap-3">
        {tab === "chats" && activeChat ? (
          <>
            <button onClick={() => setActiveChatId(null)} className="text-gray-400"><ArrowLeft className="h-6 w-6" /></button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 font-bold text-white">N</div>
            <div>
              <h1 className="font-semibold text-white">{activeChat.name}</h1>
              <p className="text-xs text-gray-400">Online</p>
            </div>
          </>
        ) : (
          <div className="flex w-full justify-between items-center">
            <h1 className="text-xl font-bold text-white">G-Chat</h1>
            <button onClick={() => supabase.auth.signOut()} className="text-gray-400"><LogOut className="h-5 w-5" /></button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')" }}>
        {tab === "chats" && activeChat ? (
          <section className="flex min-h-full flex-col justify-end gap-2 p-4 pb-32">
            {messages.map((msg) => {
              const isOwn = msg.user_id === user.id;
              return (
                <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 shadow-sm ${isOwn ? "bg-[#005c4b] text-white" : "bg-[#1f2c34] text-white"}`}>
                    {msg.media_url && <img src={msg.media_url} className="rounded-lg mb-1 max-w-full" />}
                    {msg.text && <p className="text-[15px] whitespace-pre-wrap">{msg.text}</p>}
                    <div className={`text-[10px] text-gray-400 text-right mt-1 flex items-center justify-end gap-1`}>
                      {format(new Date(msg.created_at), "HH:mm")}
                      {isOwn && <span className="text-blue-400">✓✓</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </section>
        ) : showChatList ? (
           <div className="p-4 text-center text-gray-400 mt-10">Select a chat to start messaging</div>
        ) : (
           <div className="p-4 text-center text-gray-400 mt-10 capitalize">{tab} coming soon</div>
        )}      </main>

      {/* Image Preview */}
      {selectedImage && (
        <div className="absolute bottom-20 left-0 right-0 z-30 bg-[#1f2c34] p-2 flex items-center gap-2 border-t border-gray-700">
          <img src={selectedImage} className="h-16 w-16 rounded object-cover" />
          <span className="text-sm text-gray-300 flex-1 truncate">{selectedFile?.name}</span>
          <button onClick={() => { setSelectedImage(null); setSelectedFile(null); }} className="text-red-500 font-bold px-3">✕</button>
        </div>
      )}

      {/* WhatsApp Style Composer */}
      {tab === "chats" && activeChat && (
        <footer className="fixed bottom-16 left-0 right-0 z-20 bg-[#1f2c34] p-2 flex items-end gap-2 max-w-md mx-auto">
          
          {/* Attachment Menu (Bottom Sheet) */}
          {showAttachmentMenu && (
            <div className="absolute bottom-full left-0 right-0 bg-[#1f2c34] border-t border-gray-700 p-6 rounded-t-2xl animate-in slide-in-from-bottom duration-200">
              <div className="grid grid-cols-4 gap-4">
                <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white"><ImageIcon className="h-6 w-6" /></div>
                  <span className="text-xs text-gray-400">Gallery</span>
                </button>
                <button onClick={() => cameraInputRef.current?.click()} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-pink-500 flex items-center justify-center text-white"><Camera className="h-6 w-6" /></div>
                  <span className="text-xs text-gray-400">Camera</span>
                </button>
                <button className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white"><MapPin className="h-6 w-6" /></div>
                  <span className="text-xs text-gray-400">Location</span>
                </button>
                <button className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white"><User className="h-6 w-6" /></div>
                  <span className="text-xs text-gray-400">Contact</span>
                </button>
                <button className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white"><FileText className="h-6 w-6" /></div>
                  <span className="text-xs text-gray-400">Document</span>
                </button>
                <button className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white"><List className="h-6 w-6" /></div>
                  <span className="text-xs text-gray-400">Poll</span>
                </button>
                <button className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-pink-500 flex items-center justify-center text-white"><Calendar className="h-6 w-6" /></div>
                  <span className="text-xs text-gray-400">Event</span>
                </button>
                <button className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white"><Sparkles className="h-6 w-6" /></div>
                  <span className="text-xs text-gray-400">AI Images</span>                </button>
              </div>
            </div>
          )}

          {/* Hidden Inputs */}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

          {/* Input Bar */}
          <div className="flex w-full items-center gap-2 bg-[#2a3942] rounded-3xl p-2">
            <button className="text-gray-400 p-2"><Smile className="h-6 w-6" /></button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Message"
              className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-[15px]"
            />
            <button onClick={() => setShowAttachmentMenu(!showAttachmentMenu)} className="text-gray-400 p-2 rotate-45"><Paperclip className="h-6 w-6" /></button>
            <button onClick={() => cameraInputRef.current?.click()} className="text-gray-400 p-2"><Camera className="h-6 w-6" /></button>
          </div>

          {/* Mic/Send Button */}
          <button onClick={sendMessage} className="bg-[#00a884] text-white rounded-full p-3 h-12 w-12 flex items-center justify-center shadow-lg">
            {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : (draft.trim() ? <Send className="h-5 w-5" /> : <Mic className="h-5 w-5" />)}
          </button>
        </footer>
      )}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#1f2c34] border-t border-gray-800 pb-safe">
        <div className="mx-auto flex h-16 max-w-md justify-around items-center">
          <button onClick={() => { setTab("chats"); setActiveChatId(null); }} className={`flex flex-col items-center gap-1 ${tab === "chats" ? "text-[#00a884]" : "text-gray-400"}`}><MessageCircle className="h-6 w-6" /><span className="text-[10px]">Chats</span></button>
          <button onClick={() => setTab("feed")} className={`flex flex-col items-center gap-1 ${tab === "feed" ? "text-[#00a884]" : "text-gray-400"}`}><Newspaper className="h-6 w-6" /><span className="text-[10px]">Feed</span></button>
          <button onClick={() => setTab("calls")} className={`flex flex-col items-center gap-1 ${tab === "calls" ? "text-[#00a884]" : "text-gray-400"}`}><Phone className="h-6 w-6" /><span className="text-[10px]">Calls</span></button>
          <button onClick={() => setTab("wallet")} className={`flex flex-col items-center gap-1 ${tab === "wallet" ? "text-[#00a884]" : "text-gray-400"}`}><Wallet className="h-6 w-6" /><span className="text-[10px]">Wallet</span></button>
        </div>
      </nav>
    </div>
  );
}