"use client";

import { useEffect, useRef, useState } from "react";
import { 
  ArrowLeft, MessageCircle, Users, Wallet, Smartphone, Send, LogOut, 
  Loader2, Paperclip, Plus, Phone, Video, CreditCard, TrendingUp, ArrowDownLeft, ArrowUpRight
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { GChatBackground } from "./GChatBackground";

// ... [Keep your existing Type definitions here] ...
type Message = { id: string; chat_id: string; user_id: string; text: string; media_url: string | null; created_at: string; status: string; };
type Chat = { id: string; name: string; updated_at: string; };
type View = "home" | "list" | "conversation" | "wallet";
type Transaction = { id: string; sender_id: string; receiver_id: string; amount: number; type: string; created_at: string; };

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
  
  // Wallet States
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showSendMoney, setShowSendMoney] = useState(false);
  const [sendAmount, setSendAmount] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // --- AUTH & DATA ---
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push("/auth");
      else setUser(session.user);
      setLoading(false);
    };
    checkUser();
    return () => {};
  }, [router]);
  useEffect(() => { 
    if (user) {
      if (view !== "home") fetchChats();
      if (view === "wallet") fetchWalletData();
    }
  }, [user, view]);

  useEffect(() => {
    if (activeChatId) {
      fetchMessages(activeChatId);
      const channel = supabase.channel(`chat:${activeChatId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${activeChatId}` }, (payload) => {
          setMessages((prev) => [...prev, { ...(payload.new as any), status: "delivered" }]);
        }).subscribe();
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
    const { data } = await supabase.from("messages").select("*").eq("chat_id", chatId).order("created_at", { ascending: true });
    if (data) setMessages(data);
  };

  const fetchWalletData = async () => {
    if (!user) return;
    const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", user.id).single();
    if (wallet) setWalletBalance(wallet.balance);

    const { data: txs } = await supabase.from("transactions")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(20);
    if (txs) setTransactions(txs);
  };

  const sendMessage = async () => {
    if (!draft.trim()) return;
    const { data } = await supabase.from("messages").insert({ chat_id: activeChatId, user_id: user.id, text: draft }).select().single();
    if (data) setMessages((prev) => [...prev, data]);
    setDraft("");  };

  const handleSendMoney = async () => {
    const amount = parseInt(sendAmount) * 100; // Convert to minor units
    if (!amount || amount <= 0 || !activeChatId) return;

    // Find receiver ID from chat members
    const { data: members } = await supabase.from("chat_members").select("user_id").eq("chat_id", activeChatId).neq("user_id", user.id);
    if (!members || members.length === 0) return;
    const receiverId = members[0].user_id;

    const { error } = await supabase.from("transactions").insert({
      sender_id: user.id, receiver_id: receiverId, amount: amount, type: 'transfer'
    });

    if (error) { alert("Failed to send money. Check balance."); return; }
    
    // Update local balance UI
    setWalletBalance(prev => prev - amount);
    setShowSendMoney(false);
    setSendAmount("");
    alert(`Successfully sent $${(amount/100).toFixed(2)}!`);
    fetchWalletData();
  };

  const openChat = (chat: Chat) => { setActiveChatId(chat.id); setActiveChatName(chat.name); setView("conversation"); };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#020617]"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>;
  if (!user) return null;

  return (
    <div className="relative min-h-screen w-full max-w-md mx-auto text-white overflow-hidden font-sans">
      <GChatBackground />

      {/* ================= WALLET VIEW ================= */}
      {view === "wallet" && (
        <div className="relative z-10 flex flex-col min-h-screen p-6">
          <header className="flex justify-between items-center mb-8">
            <button onClick={() => setView("home")} className="p-2 rounded-full bg-white/5"><ArrowLeft className="h-5 w-5" /></button>
            <h1 className="text-xl font-bold">G-Pay Wallet</h1>
            <div className="w-9" />
          </header>

          {/* Balance Card */}
          <div className="relative p-6 rounded-3xl bg-gradient-to-br from-emerald-600 to-cyan-700 shadow-2xl shadow-emerald-500/20 mb-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <p className="text-emerald-100 text-sm mb-1">Total Balance</p>
            <h2 className="text-4xl font-bold text-white mb-6">${(walletBalance / 100).toFixed(2)}</h2>
            <div className="flex gap-3">
              <button className="flex-1 py-2.5 rounded-xl bg-white/20 backdrop-blur text-white font-medium text-sm hover:bg-white/30">Add Money</button>              <button className="flex-1 py-2.5 rounded-xl bg-white/20 backdrop-blur text-white font-medium text-sm hover:bg-white/30">Withdraw</button>
            </div>
          </div>

          {/* Transactions */}
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-cyan-400" /> Recent Activity</h3>
          <div className="flex-1 overflow-y-auto space-y-3 pb-20">
            {transactions.length === 0 ? (
              <p className="text-center text-gray-500 mt-10">No transactions yet.</p>
            ) : transactions.map((tx) => {
              const isSent = tx.sender_id === user.id;
              return (
                <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-full ${isSent ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {isSent ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-white">{isSent ? "Sent" : "Received"}</p>
                      <p className="text-xs text-gray-400">{format(new Date(tx.created_at), 'MMM d, HH:mm')}</p>
                    </div>
                  </div>
                  <span className={`font-bold ${isSent ? 'text-red-400' : 'text-emerald-400'}`}>
                    {isSent ? '-' : '+'}${(tx.amount / 100).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= HOME VIEW ================= */}
      {view === "home" && (
        <div className="relative z-10 flex flex-col min-h-screen p-6">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-bold text-black text-xl">G</div>
              <span className="font-bold text-lg">G-Chat</span>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="p-2 rounded-full bg-white/5"><LogOut className="h-5 w-5 text-gray-400" /></button>
          </div>

          <div className="text-center mb-10 mt-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-cyan-200 to-emerald-300 bg-clip-text text-transparent mb-2">One World. One App.</h1>
            <p className="text-lg font-medium text-purple-400 mb-4">Infinite Possibilities.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <button className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-left"><Users className="h-8 w-8 text-purple-400 mb-3" /><h3 className="font-bold">G-Tribe</h3><p className="text-xs text-gray-400">Coming Soon</p></button>            <button onClick={() => setView("wallet")} className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-left"><Wallet className="h-8 w-8 text-blue-400 mb-3" /><h3 className="font-bold">G-Pay</h3><p className="text-xs text-gray-400">Wallet & Earn</p></button>
            <button className="col-span-2 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center gap-4"><Smartphone className="h-6 w-6 text-emerald-400" /><div className="text-left"><h3 className="font-bold">G-Chat one</h3><p className="text-xs text-gray-400">Coming Soon</p></div></button>
          </div>

          <div className="flex-1" />
          <button onClick={() => setView("list")} className="w-full p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 backdrop-blur-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"><MessageCircle className="h-6 w-6 text-cyan-400" /></div>
            <div className="flex-1 text-left"><p className="text-white font-medium">Message the world...</p><p className="text-xs text-gray-400">Select a conversation</p></div>
            <Send className="h-5 w-5 text-cyan-400" />
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
            <button className="p-2 rounded-full bg-emerald-500/20 text-emerald-400"><Plus className="h-5 w-5" /></button>
          </header>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {chats.length === 0 ? <div className="text-center py-20 text-gray-500">No chats yet. Tap + to start.</div> : 
              chats.map((chat) => (
                <button key={chat.id} onClick={() => openChat(chat)} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 text-left">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center font-bold">{chat.name.charAt(0).toUpperCase()}</div>
                  <div className="flex-1 border-b border-white/5 pb-3"><h3 className="font-medium text-white">{chat.name}</h3><p className="text-xs text-gray-500">Tap to open</p></div>
                </button>
              ))
            }
          </div>
        </div>
      )}

      {/* ================= CONVERSATION VIEW ================= */}
      {view === "conversation" && activeChatId && (
        <div className="relative z-10 flex flex-col min-h-screen">
          <header className="sticky top-0 z-20 bg-[#020617]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3">
            <button onClick={() => setView("list")} className="p-2 -ml-2 rounded-full hover:bg-white/5"><ArrowLeft className="h-5 w-5" /></button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center font-bold">{activeChatName.charAt(0).toUpperCase()}</div>
            <div className="flex-1"><h1 className="font-semibold text-white text-sm">{activeChatName}</h1><p className="text-xs text-emerald-400">Online</p></div>
            <div className="flex gap-1">
              <button className="p-2 rounded-full hover:bg-white/5 text-gray-400"><Phone className="h-5 w-5" /></button>
              <button className="p-2 rounded-full hover:bg-white/5 text-gray-400"><Video className="h-5 w-5" /></button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">            {messages.map((msg) => {
              const isOwn = msg.user_id === user.id;
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

          <footer className="fixed bottom-0 left-0 right-0 z-20 bg-[#020617]/90 backdrop-blur-xl border-t border-white/5 p-3 max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSendMoney(true)} className="p-3 rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"><CreditCard className="h-5 w-5" /></button>
              <button className="p-3 rounded-full bg-white/5 text-gray-400"><Paperclip className="h-5 w-5" /></button>
              <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl px-4 py-3">
                <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Type a message..." className="w-full bg-transparent text-white outline-none" />
              </div>
              <button onClick={sendMessage} className="p-3 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg"><Send className="h-5 w-5" /></button>
            </div>
          </footer>
        </div>
      )}

      {/* ================= SEND MONEY MODAL ================= */}
      {showSendMoney && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setShowSendMoney(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-[#0B1120] border border-white/10 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Send Money to {activeChatName}</h3>
            <p className="text-sm text-gray-400 mb-4">Available Balance: ${(walletBalance / 100).toFixed(2)}</p>
            <input type="number" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} placeholder="Amount (USD)" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white mb-4 outline-none focus:border-cyan-500" />
            <div className="flex gap-2">
              <button onClick={() => setShowSendMoney(false)} className="flex-1 py-3 rounded-xl bg-white/5">Cancel</button>
              <button onClick={handleSendMoney} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 font-bold">Send</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= BOTTOM NAV ================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#020617]/90 backdrop-blur-xl border-t border-white/5 max-w-md mx-auto">
        <div className="flex justify-around items-center h-16">
          <button onClick={() => setView("home")} className={`flex flex-col items-center gap-1 ${view === "home" ? "text-cyan-400" : "text-gray-500"}`}><MessageCircle className="h-6 w-6" /><span className="text-[10px]">Home</span></button>
          <button onClick={() => setView("list")} className={`flex flex-col items-center gap-1 ${view === "list" || view === "conversation" ? "text-cyan-400" : "text-gray-500"}`}><Users className="h-6 w-6" /><span className="text-[10px]">Chats</span></button>
          <button onClick={() => setView("wallet")} className={`flex flex-col items-center gap-1 ${view === "wallet" ? "text-cyan-400" : "text-gray-500"}`}><Wallet className="h-6 w-6" /><span className="text-[10px]">G-Pay</span></button>
        </div>
      </nav>    </div>
  );
}