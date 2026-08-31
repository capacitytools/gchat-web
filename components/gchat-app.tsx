"use client";

import { useEffect, useRef, useState } from "react";
import { 
  ArrowLeft, MessageCircle, Users, Wallet, Smartphone, Send, LogOut, 
  Loader2, Paperclip, Plus, Phone, Video, CreditCard, TrendingUp, 
  ArrowDownLeft, ArrowUpRight, Sparkles, PlayCircle, CheckCircle2,
  Heart, MessageSquare, Image as ImageIcon, X, MoreHorizontal,
  Mic, Video as VideoIcon, PhoneCall, Building2, Users2, Hash,
  Settings, BarChart3, MessageCircleReply, Clock
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import imageCompression from "browser-image-compression";
import { GChatBackground } from "./GChatBackground";

// Type definitions
type Message = { id: string; chat_id: string; user_id: string; text: string; media_url: string | null; created_at: string; status: string; };
type Chat = { id: string; name: string; updated_at: string; };
type View = "home" | "list" | "conversation" | "wallet" | "feed" | "gtribe" | "gchatone" | "call";
type Transaction = { id: string; sender_id: string; receiver_id: string; amount: number; type: string; created_at: string; };
type AdCampaign = { id: string; title: string; description: string; reward_amount: number; };
type Post = { id: string; user_id: string; content: string; media_url: string | null; post_type: string; created_at: string; profiles: { username: string; display_name: string } | null; is_liked: boolean; };
type Group = { id: string; name: string; description: string; owner_id: string; group_type: string; member_count: number; created_at: string; };
type BusinessProfile = { id: string; user_id: string; business_name: string; category: string; description: string; is_verified: boolean; auto_reply_enabled: boolean; auto_reply_message: string | null; };

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
  
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showSendMoney, setShowSendMoney] = useState(false);
  const [sendAmount, setSendAmount] = useState("");

  const [availableAds, setAvailableAds] = useState<AdCampaign[]>([]);
  const [watchingAd, setWatchingAd] = useState<AdCampaign | null>(null);
  const [adProgress, setAdProgress] = useState(0);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  // Feed States
  const [posts, setPosts] = useState<Post[]>([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  // G-Tribe States
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");

  // G-Chat One States
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [showBusinessSetup, setShowBusinessSetup] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [autoReply, setAutoReply] = useState("");

  // Call States
  const [activeCall, setActiveCall] = useState<any>(null);
  const [isInCall, setIsInCall] = useState(false);

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
  }, [router]);

  useEffect(() => { 
    if (user) {
      if (view !== "home") fetchChats();
      if (view === "wallet") fetchWalletData();
      if (view === "feed") fetchFeedData();
      if (view === "gtribe") fetchGroups();
      if (view === "gchatone") fetchBusinessProfile();
    }
  }, [user, view]);

  useEffect(() => {    if (activeChatId) {
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
    const { data: txs } = await supabase.from("transactions").select("*").or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order("created_at", { ascending: false }).limit(20);
    if (txs) setTransactions(txs);
    const { data: ads } = await supabase.from("ad_campaigns").select("*").eq("is_active", true).limit(5);
    if (ads) setAvailableAds(ads);
  };

  const fetchFeedData = async () => {
    if (!user) return;
    const { data: postsData } = await supabase.from("posts").select(`*, profiles:user_id(username, display_name)`).eq("post_type", "post").order("created_at", { ascending: false }).limit(20);
    if (postsData) {
      const postsWithLikes = await Promise.all(postsData.map(async (post: any) => {
        const { data: likeData } = await supabase.from("post_likes").select("id").eq("user_id", user.id).eq("post_id", post.id).single();
        return { ...post, is_liked: !!likeData };
      }));
      setPosts(postsWithLikes);
    }
  };

  const fetchGroups = async () => {
    if (!user) return;
    const { data } = await supabase.from("groups").select("*").eq("is_public", true).order("created_at", { ascending: false }).limit(20);
    if (data) setGroups(data);
  };
  const fetchBusinessProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("business_profiles").select("*").eq("user_id", user.id).single();
    if (data) setBusinessProfile(data);
  };

  const sendMessage = async () => {
    if (!draft.trim()) return;
    const { data } = await supabase.from("messages").insert({ chat_id: activeChatId, user_id: user.id, text: draft }).select().single();
    if (data) setMessages((prev) => [...prev, data]);
    setDraft("");
  };

  const handleSendMoney = async () => {
    const amount = parseInt(sendAmount) * 100;
    if (!amount || amount <= 0 || !activeChatId) return;
    const { data: members } = await supabase.from("chat_members").select("user_id").eq("chat_id", activeChatId).neq("user_id", user.id);
    if (!members || members.length === 0) return;
    const receiverId = members[0].user_id;
    await supabase.from("transactions").insert({ sender_id: user.id, receiver_id: receiverId, amount, type: 'transfer' });
    setWalletBalance(prev => prev - amount);
    setShowSendMoney(false);
    setSendAmount("");
    fetchWalletData();
  };

  const startWatchingAd = (ad: AdCampaign) => {
    setWatchingAd(ad);
    setAdProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setAdProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        claimReward(ad.id);
      }
    }, 300);
  };

  const claimReward = async (adId: string) => {
    try {
      const { error } = await supabase.rpc('claim_ad_reward', { target_campaign_id: adId });
      if (error) throw error;
      setWalletBalance(prev => prev + (watchingAd?.reward_amount || 0));
      setTimeout(() => {
        setWatchingAd(null);
        alert(`✅ You earned $${((watchingAd?.reward_amount || 0) / 100).toFixed(2)}!`);
        fetchWalletData();      }, 1000);
    } catch (err: any) {
      alert(err.message || "You already watched this ad!");
      setWatchingAd(null);
    }
  };

  const generateAISummary = () => {
    setAiSummary("AI is analyzing your chat...");
    setTimeout(() => {
      setAiSummary(`Summary: ${messages.length} messages exchanged.`);
    }, 1500);
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() && !postImage) return;
    setIsPosting(true);
    let mediaUrl = null;
    try {
      if (postImage) {
        const compressedFile = await imageCompression(postImage, { maxSizeMB: 2, maxWidthOrHeight: 1920, useWebWorker: true });
        const fileName = `${user.id}/posts/${Date.now()}.${compressedFile.name.split('.').pop()}`;
        const { data: uploadData } = await supabase.storage.from("messages").upload(fileName, compressedFile);
        if (uploadData) {
          const { data: urlData } = supabase.storage.from("messages").getPublicUrl(uploadData.path);
          mediaUrl = urlData.publicUrl;
        }
      }
      await supabase.from("posts").insert({ user_id: user.id, content: postContent.trim(), media_url: mediaUrl, post_type: "post" });
      setShowCreatePost(false);
      setPostContent("");
      setPostImage(null);
      setPostImagePreview(null);
      fetchFeedData();
    } catch (err: any) {
      alert("Failed to create post: " + err.message);
    } finally {
      setIsPosting(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const { data } = await supabase.from("groups").insert({
        name: newGroupName,
        description: newGroupDesc,
        owner_id: user.id,
        group_type: "group"
      }).select().single();      
      if (data) {
        await supabase.from("group_members").insert({ group_id: data.id, user_id: user.id, role: "owner" });
        setShowCreateGroup(false);
        setNewGroupName("");
        setNewGroupDesc("");
        fetchGroups();
        alert("Group created successfully!");
      }
    } catch (err: any) {
      alert("Failed to create group: " + err.message);
    }
  };

  const handleSetupBusiness = async () => {
    if (!businessName.trim()) return;
    try {
      const { error } = await supabase.from("business_profiles").insert({
        user_id: user.id,
        business_name: businessName,
        category: businessCategory,
        auto_reply_enabled: !!autoReply,
        auto_reply_message: autoReply || null
      });
      if (error) throw error;
      setShowBusinessSetup(false);
      setBusinessName("");
      setBusinessCategory("");
      setAutoReply("");
      fetchBusinessProfile();
      alert("Business profile created!");
    } catch (err: any) {
      alert("Failed to setup business: " + err.message);
    }
  };

  const startCall = (type: 'voice' | 'video') => {
    setActiveCall({ type, status: 'initiated' });
    setIsInCall(true);
    // In production, integrate WebRTC or Agora here
    setTimeout(() => {
      alert(`📞 ${type === 'video' ? 'Video' : 'Voice'} call started! (Demo mode - integrate WebRTC for production)`);
    }, 1000);
  };

  const endCall = () => {
    setIsInCall(false);
    setActiveCall(null);
    alert("Call ended");
  };
  const openChat = (chat: Chat) => { setActiveChatId(chat.id); setActiveChatName(chat.name); setView("conversation"); setAiSummary(null); };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#020617]"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>;
  if (!user) return null;

  return (
    <div className="relative min-h-screen w-full max-w-md mx-auto text-white overflow-hidden font-sans">
      <GChatBackground />

      {/* G-TRIBE VIEW */}
      {view === "gtribe" && (
        <div className="relative z-10 flex flex-col min-h-screen pb-24">
          <header className="sticky top-0 z-20 bg-[#020617]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-bold">G-Tribe</h1>
            <button onClick={() => setShowCreateGroup(true)} className="p-2 rounded-full bg-emerald-500/20 text-emerald-400"><Plus className="h-5 w-5" /></button>
          </header>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {groups.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <Users2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No groups yet. Create one!</p>
              </div>
            ) : groups.map((group) => (
              <button key={group.id} className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center font-bold">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{group.name}</h3>
                    <p className="text-xs text-gray-400">{group.member_count} members • {group.group_type}</p>
                  </div>
                  <Users2 className="h-5 w-5 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* G-CHAT ONE VIEW */}
      {view === "gchatone" && (
        <div className="relative z-10 flex flex-col min-h-screen pb-24">
          <header className="sticky top-0 z-20 bg-[#020617]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-bold">G-Chat One</h1>
            {!businessProfile && <button onClick={() => setShowBusinessSetup(true)} className="p-2 rounded-full bg-emerald-500/20 text-emerald-400"><Plus className="h-5 w-5" /></button>}
          </header>
          <div className="flex-1 overflow-y-auto p-4">
            {!businessProfile ? (              <div className="text-center py-20">
                <Building2 className="h-16 w-16 mx-auto mb-4 text-emerald-400" />
                <h2 className="text-xl font-bold mb-2">Turn Your Chat Into Business</h2>
                <p className="text-sm text-gray-400 mb-6">Create a business profile to access powerful tools</p>
                <button onClick={() => setShowBusinessSetup(true)} className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 font-bold">Setup Business</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-cyan-700">
                  <h2 className="text-xl font-bold">{businessProfile.business_name}</h2>
                  <p className="text-sm text-emerald-100">{businessProfile.category}</p>
                  {businessProfile.is_verified && <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded bg-white/20 text-xs"><CheckCircle2 className="h-3 w-3" /> Verified</span>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button className="p-4 rounded-xl bg-white/5 border border-white/5 text-left"><BarChart3 className="h-6 w-6 text-cyan-400 mb-2" /><p className="text-sm font-medium">Analytics</p></button>
                  <button className="p-4 rounded-xl bg-white/5 border border-white/5 text-left"><MessageCircleReply className="h-6 w-6 text-purple-400 mb-2" /><p className="text-sm font-medium">Auto-Reply</p></button>
                  <button className="p-4 rounded-xl bg-white/5 border border-white/5 text-left"><Users2 className="h-6 w-6 text-pink-400 mb-2" /><p className="text-sm font-medium">Customers</p></button>
                  <button className="p-4 rounded-xl bg-white/5 border border-white/5 text-left"><Settings className="h-6 w-6 text-orange-400 mb-2" /><p className="text-sm font-medium">Settings</p></button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CALL VIEW */}
      {view === "call" && (
        <div className="relative z-10 flex flex-col min-h-screen items-center justify-center p-6">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center mb-6">
            <PhoneCall className="h-16 w-16" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Active Call</h2>
          <p className="text-gray-400 mb-8">{activeCall?.type === 'video' ? 'Video' : 'Voice'} call in progress...</p>
          <button onClick={endCall} className="px-8 py-4 rounded-full bg-red-500 text-white font-bold">End Call</button>
        </div>
      )}

      {/* WALLET VIEW */}
      {view === "wallet" && (
        <div className="relative z-10 flex flex-col min-h-screen p-6 pb-24">
          <header className="flex justify-between items-center mb-8">
            <button onClick={() => setView("home")} className="p-2 rounded-full bg-white/5"><ArrowLeft className="h-5 w-5" /></button>
            <h1 className="text-xl font-bold">G-Pay Wallet</h1>
            <div className="w-9" />
          </header>
          <div className="relative p-6 rounded-3xl bg-gradient-to-br from-emerald-600 to-cyan-700 shadow-2xl shadow-emerald-500/20 mb-8">
            <p className="text-emerald-100 text-sm mb-1">Total Balance</p>
            <h2 className="text-4xl font-bold text-white mb-6">${(walletBalance / 100).toFixed(2)}</h2>
            <div className="flex gap-3">
              <button className="flex-1 py-2.5 rounded-xl bg-white/20 backdrop-blur text-white font-medium text-sm">Add Money</button>              <button className="flex-1 py-2.5 rounded-xl bg-white/20 backdrop-blur text-white font-medium text-sm">Withdraw</button>
            </div>
          </div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><PlayCircle className="h-5 w-5 text-yellow-400" /> G-Rewards</h3>
          <div className="space-y-3 mb-8">
            {availableAds.map((ad) => (
              <button key={ad.id} onClick={() => startWatchingAd(ad)} className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-yellow-500/20 text-yellow-400"><PlayCircle className="h-5 w-5" /></div>
                  <div className="text-left"><p className="font-bold text-white text-sm">{ad.title}</p><p className="text-xs text-gray-400">Watch 3s to earn</p></div>
                </div>
                <span className="font-bold text-yellow-400">+${(ad.reward_amount / 100).toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* HOME VIEW */}
      {view === "home" && (
        <div className="relative z-10 flex flex-col min-h-screen p-6 pb-24">
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
            <button onClick={() => setView("gtribe")} className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-left"><Users2 className="h-8 w-8 text-purple-400 mb-3" /><h3 className="font-bold">G-Tribe</h3><p className="text-xs text-gray-400">Groups & Communities</p></button>
            <button onClick={() => setView("wallet")} className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-left"><Wallet className="h-8 w-8 text-blue-400 mb-3" /><h3 className="font-bold">G-Pay</h3><p className="text-xs text-gray-400">Wallet & Earn</p></button>
            <button onClick={() => setView("gchatone")} className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-left"><Building2 className="h-8 w-8 text-emerald-400 mb-3" /><h3 className="font-bold">G-Chat One</h3><p className="text-xs text-gray-400">Business Tools</p></button>
            <button className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-left"><Smartphone className="h-8 w-8 text-orange-400 mb-3" /><h3 className="font-bold">G-Chat one</h3><p className="text-xs text-gray-400">All-in-One</p></button>
          </div>
          <div className="flex-1" />
          <button onClick={() => setView("list")} className="w-full p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 backdrop-blur-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"><MessageCircle className="h-6 w-6 text-cyan-400" /></div>
            <div className="flex-1 text-left"><p className="text-white font-medium">Message the world...</p><p className="text-xs text-gray-400">Select a conversation</p></div>
            <Send className="h-5 w-5 text-cyan-400" />
          </button>
        </div>
      )}

      {/* CHAT LIST VIEW */}
      {view === "list" && (
        <div className="relative z-10 flex flex-col min-h-screen pb-24">          <header className="sticky top-0 z-20 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setView("home")} className="p-2 -ml-2 rounded-full hover:bg-white/5"><ArrowLeft className="h-5 w-5" /></button>
              <h1 className="text-xl font-bold">Chats</h1>
            </div>
            <button className="p-2 rounded-full bg-emerald-500/20 text-emerald-400"><Plus className="h-5 w-5" /></button>
          </header>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {chats.map((chat) => (
              <button key={chat.id} onClick={() => openChat(chat)} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 text-left">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center font-bold">{chat.name.charAt(0).toUpperCase()}</div>
                <div className="flex-1 border-b border-white/5 pb-3"><h3 className="font-medium text-white">{chat.name}</h3><p className="text-xs text-gray-500">Tap to open</p></div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CONVERSATION VIEW */}
      {view === "conversation" && activeChatId && (
        <div className="relative z-10 flex flex-col min-h-screen">
          <header className="sticky top-0 z-20 bg-[#020617]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3">
            <button onClick={() => setView("list")} className="p-2 -ml-2 rounded-full hover:bg-white/5"><ArrowLeft className="h-5 w-5" /></button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center font-bold">{activeChatName.charAt(0).toUpperCase()}</div>
            <div className="flex-1"><h1 className="font-semibold text-white text-sm">{activeChatName}</h1><p className="text-xs text-emerald-400">Online</p></div>
            <button onClick={() => startCall('voice')} className="p-2 rounded-full hover:bg-white/5 text-green-400"><Phone className="h-5 w-5" /></button>
            <button onClick={() => startCall('video')} className="p-2 rounded-full hover:bg-white/5 text-blue-400"><Video className="h-5 w-5" /></button>
          </header>
          {aiSummary && <div className="mx-4 mt-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-sm text-purple-200"><Sparkles className="h-4 w-4 inline mr-1" />{aiSummary}</div>}
          <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
            {messages.map((msg) => {
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
          <div className="fixed bottom-16 left-0 right-0 z-30 bg-[#020617]/95 backdrop-blur-xl border-t border-white/10 p-3 max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSendMoney(true)} className="p-3 rounded-full bg-blue-500/10 text-blue-400 shrink-0"><CreditCard className="h-5 w-5" /></button>
              <button className="p-3 rounded-full bg-white/5 text-gray-400 shrink-0"><Paperclip className="h-5 w-5" /></button>
              <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl px-4 py-3">
                <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Type..." className="w-full bg-transparent text-white outline-none" />
              </div>              <button onClick={sendMessage} className="p-3 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shrink-0"><Send className="h-5 w-5" /></button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showCreatePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => !isPosting && setShowCreatePost(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-[#0B1120] border border-white/10 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Create Post</h3>
              <button onClick={() => !isPosting && setShowCreatePost(false)} className="p-2 rounded-full hover:bg-white/5"><X className="h-5 w-5" /></button>
            </div>
            <textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} placeholder="What's on your mind?" className="w-full h-24 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none mb-4 resize-none" />
            {postImagePreview && <img src={postImagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl mb-4" />}
            <div className="flex gap-2">
              <button onClick={() => document.getElementById('post-image-input')?.click()} className="flex-1 py-3 rounded-xl bg-white/5 flex items-center justify-center gap-2"><ImageIcon className="h-5 w-5" /> Photo</button>
              <button onClick={handleCreatePost} disabled={isPosting} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 font-bold disabled:opacity-50">{isPosting ? "Posting..." : "Post"}</button>
            </div>
            <input id="post-image-input" type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if(f) { setPostImage(f); setPostImagePreview(URL.createObjectURL(f)); }}} />
          </div>
        </div>
      )}

      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setShowCreateGroup(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-[#0B1120] border border-white/10 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Create Group</h3>
            <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Group name" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white mb-3" />
            <textarea value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} placeholder="Description (optional)" className="w-full h-20 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white mb-4 resize-none" />
            <div className="flex gap-2">
              <button onClick={() => setShowCreateGroup(false)} className="flex-1 py-3 rounded-xl bg-white/5">Cancel</button>
              <button onClick={handleCreateGroup} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 font-bold">Create</button>
            </div>
          </div>
        </div>
      )}

      {showBusinessSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setShowBusinessSetup(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-[#0B1120] border border-white/10 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Setup Business</h3>
            <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Business name" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white mb-3" />
            <input value={businessCategory} onChange={(e) => setBusinessCategory(e.target.value)} placeholder="Category (e.g., Retail)" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white mb-3" />
            <textarea value={autoReply} onChange={(e) => setAutoReply(e.target.value)} placeholder="Auto-reply message (optional)" className="w-full h-20 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white mb-4 resize-none" />
            <div className="flex gap-2">
              <button onClick={() => setShowBusinessSetup(false)} className="flex-1 py-3 rounded-xl bg-white/5">Cancel</button>
              <button onClick={handleSetupBusiness} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 font-bold">Setup</button>
            </div>          </div>
        </div>
      )}

      {showSendMoney && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowSendMoney(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-[#0B1120] border border-white/10 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Send Money</h3>
            <p className="text-sm text-gray-400 mb-4">Balance: ${(walletBalance / 100).toFixed(2)}</p>
            <input type="number" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} placeholder="Amount (USD)" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white mb-4 outline-none" />
            <div className="flex gap-2">
              <button onClick={() => setShowSendMoney(false)} className="flex-1 py-3 rounded-xl bg-white/5">Cancel</button>
              <button onClick={handleSendMoney} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 font-bold">Send</button>
            </div>
          </div>
        </div>
      )}

      {watchingAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#0B1120] border border-white/10 p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mx-auto mb-6 animate-pulse"><PlayCircle className="h-10 w-10 text-white" /></div>
            <h3 className="text-xl font-bold mb-2">{watchingAd.title}</h3>
            <div className="w-full bg-white/10 rounded-full h-2 mb-2"><div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-300" style={{ width: `${adProgress}%` }} /></div>
            <p className="text-xs text-gray-500">Watching... {Math.floor(adProgress / 10)}s / 3s</p>
            {adProgress === 100 && <div className="mt-4 flex items-center justify-center gap-2 text-emerald-400 font-bold"><CheckCircle2 className="h-5 w-5" /> Reward Claimed!</div>}
          </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#020617]/95 backdrop-blur-xl border-t border-white/10 max-w-md mx-auto">
        <div className="flex justify-around items-center h-16">
          <button onClick={() => setView("home")} className={`flex flex-col items-center gap-1 ${view === "home" ? "text-cyan-400" : "text-gray-500"}`}><MessageCircle className="h-6 w-6" /><span className="text-[10px]">Home</span></button>
          <button onClick={() => setView("list")} className={`flex flex-col items-center gap-1 ${view === "list" || view === "conversation" ? "text-cyan-400" : "text-gray-500"}`}><Users className="h-6 w-6" /><span className="text-[10px]">Chats</span></button>
          <button onClick={() => setView("gtribe")} className={`flex flex-col items-center gap-1 ${view === "gtribe" ? "text-cyan-400" : "text-gray-500"}`}><Users2 className="h-6 w-6" /><span className="text-[10px]">G-Tribe</span></button>
          <button onClick={() => setView("wallet")} className={`flex flex-col items-center gap-1 ${view === "wallet" ? "text-cyan-400" : "text-gray-500"}`}><Wallet className="h-6 w-6" /><span className="text-[10px]">G-Pay</span></button>
        </div>
      </nav>
    </div>
  );
}