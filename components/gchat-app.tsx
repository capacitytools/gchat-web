"use client";

import { useEffect, useRef, useState } from "react";
import { 
  Loader2, PlayCircle, CheckCircle2, X, Sparkles, Image as ImageIcon, 
  Search, MessageCircle, Users, Wallet, User
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { GChatBackground } from "./GChatBackground";
import { NotificationPrompt } from "./NotificationPrompt";

// Import all views
import { HomeView } from "./views/HomeView";
import { ChatsListView } from "./views/ChatsListView";
import { ConversationView } from "./views/ConversationView";
import { FeedView } from "./views/FeedView";
import { WalletView } from "./views/WalletView";
import { ProfileView } from "./views/ProfileView";
import { EditProfileView } from "./views/EditProfileView";
import { AnalyticsView } from "./views/AnalyticsView";
import { SettingsView } from "./views/SettingsView";
import { GTribeView } from "./views/GTribeView";
import { GChatOneView } from "./views/GChatOneView";

// Types
type Message = { id: string; chat_id: string; user_id: string; text: string; media_url: string | null; created_at: string; status: string; };
type Chat = { id: string; name: string; updated_at: string; };
type View = "home" | "list" | "conversation" | "wallet" | "feed" | "gtribe" | "gchatone" | "profile" | "edit-profile" | "analytics" | "settings";
type Transaction = { id: string; sender_id: string; receiver_id: string; amount: number; type: string; created_at: string; };
type AdCampaign = { id: string; title: string; description: string; reward_amount: number; };
type Post = { id: string; user_id: string; content: string; media_url: string | null; post_type: string; created_at: string; profiles: { username: string; display_name: string } | null; is_liked: boolean; likes_count: number; };
type Group = { id: string; name: string; description: string; owner_id: string; group_type: string; member_count: number; created_at: string; };
type BusinessProfile = { id: string; user_id: string; business_name: string; category: string; description: string; is_verified: boolean; auto_reply_enabled: boolean; auto_reply_message: string | null; };
type UserProfile = { id: string; user_id: string; username: string; display_name: string; bio: string; email: string; phone: string; whatsapp: string; address: string; avatar_url: string | null; cover_url: string | null; instagram: string; twitter: string; website: string; profile_views: number; posts_count: number; messages_sent: number; badges: string[]; created_at: string; };

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

  const [posts, setPosts] = useState<Post[]>([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");

  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [showBusinessSetup, setShowBusinessSetup] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [autoReply, setAutoReply] = useState("");

  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({
    display_name: "", username: "", bio: "", email: "", phone: "", 
    whatsapp: "", address: "", instagram: "", twitter: "", website: ""
  });
  const [profileAvatar, setProfileAvatar] = useState<File | null>(null);
  const [profileCover, setProfileCover] = useState<File | null>(null);
  const [profileAvatarPreview, setProfileAvatarPreview] = useState<string | null>(null);
  const [profileCoverPreview, setProfileCoverPreview] = useState<string | null>(null);

  const [showNewChat, setShowNewChat] = useState(false);
  const [searchUsername, setSearchUsername] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);

  // Auth  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push("/auth");
      else setUser(session.user);
      setLoading(false);
    };
    checkUser();
  }, [router]);

  // Data fetching
  useEffect(() => { 
    if (user) {
      if (view !== "home") fetchChats();
      if (view === "wallet") fetchWalletData();
      if (view === "feed") fetchFeedData();
      if (view === "gtribe") fetchGroups();
      if (view === "gchatone") fetchBusinessProfile();
      if (view === "profile" || view === "edit-profile" || view === "analytics") fetchProfile();
    }
  }, [user, view]);

  // Realtime messages
  useEffect(() => {
    if (activeChatId) {
      fetchMessages(activeChatId);
      return () => {
        supabase.removeChannel(supabase.channel(`chat:${activeChatId}`));
      };
    }
  }, [activeChatId]);

  const fetchChats = async () => {
    if (!user) return;
    const { data } = await supabase.from("chat_members").select("chat_id, chats(id, name, created_at)").eq("user_id", user.id);
    if (data) setChats(data.map((item: any) => ({ id: item.chats.id, name: item.chats.name, updated_at: item.chats.created_at })));
  };

  const fetchMessages = async (chatId: string) => {
    const { data } = await supabase.from("messages").select("*").eq("chat_id", chatId).order("created_at", { ascending: true });
    if (data) {
      const uniqueMessages = data.filter((msg: any, index: number, self: any[]) => 
        index === self.findIndex(m => m.id === msg.id)
      );
      setMessages(uniqueMessages);
      
      const channel = supabase.channel(`chat:${chatId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` }, (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => {            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, { ...newMsg, status: "delivered" }];
          });
        })
        .subscribe();
      
      return () => { supabase.removeChannel(channel); };
    }
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
        return { ...post, is_liked: !!likeData, likes_count: post.likes_count || 0 };
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

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (data) {
      setProfile(data);
      setEditForm({        display_name: data.display_name || "",
        username: data.username || "",
        bio: data.bio || "",
        email: data.email || "",
        phone: data.phone || "",
        whatsapp: data.whatsapp || "",
        address: data.address || "",
        instagram: data.instagram || "",
        twitter: data.twitter || "",
        website: data.website || ""
      });
    }
  };

  const sendMessage = async () => {
    if (!draft.trim()) return;
    const { data } = await supabase.from("messages").insert({ chat_id: activeChatId, user_id: user.id, text: draft }).select().single();
    if (data) {
      setMessages(prev => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, data];
      });
    }
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

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount) * 100;
    if (!amount || amount <= 0 || amount > walletBalance) { alert("Invalid amount or insufficient balance."); return; }
    if (!bankName || !accountNumber || !accountName) { alert("Please fill in all bank details."); return; }
    setIsWithdrawing(true);
    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, bank_name: bankName, account_number: accountNumber, account_name: accountName })
      });      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      alert("Withdrawal request submitted successfully!");
      setShowWithdraw(false);
      setWithdrawAmount(""); setBankName(""); setAccountNumber(""); setAccountName("");
      fetchWalletData();
    } catch (err: any) { alert("Withdrawal failed: " + err.message); }
    finally { setIsWithdrawing(false); }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      let avatarUrl = profile?.avatar_url || null;
      let coverUrl = profile?.cover_url || null;

      if (profileAvatar) {
        const compressedFile = await imageCompression(profileAvatar, { maxSizeMB: 1, maxWidthOrHeight: 800 });
        const fileName = `${user.id}/avatar/${Date.now()}.${compressedFile.name.split('.').pop()}`;
        const { data: uploadData } = await supabase.storage.from("messages").upload(fileName, compressedFile);
        if (uploadData) {
          const { data: urlData } = supabase.storage.from("messages").getPublicUrl(uploadData.path);
          avatarUrl = urlData.publicUrl;
        }
      }

      if (profileCover) {
        const compressedFile = await imageCompression(profileCover, { maxSizeMB: 2, maxWidthOrHeight: 1920 });
        const fileName = `${user.id}/cover/${Date.now()}.${compressedFile.name.split('.').pop()}`;
        const { data: uploadData } = await supabase.storage.from("messages").upload(fileName, compressedFile);
        if (uploadData) {
          const { data: urlData } = supabase.storage.from("messages").getPublicUrl(uploadData.path);
          coverUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase.from("profiles").update({
        ...editForm,
        avatar_url: avatarUrl,
        cover_url: coverUrl,
        updated_at: new Date().toISOString()
      }).eq("id", user.id);

      if (error) throw error;
      setView("profile");
      setProfileAvatar(null);
      setProfileCover(null);
      setProfileAvatarPreview(null);
      setProfileCoverPreview(null);
      fetchProfile();      alert("Profile updated successfully!");
    } catch (err: any) { alert("Failed to update profile: " + err.message); }
  };

  const handleSetupBusiness = async () => {
    if (!businessName.trim()) return;
    try {
      const { data: bizData, error } = await supabase.from("business_profiles").insert({
        user_id: user.id, business_name: businessName, category: businessCategory,
        auto_reply_enabled: !!autoReply, auto_reply_message: autoReply || null
      }).select().single();
      if (error) throw error;
      await supabase.from("business_ai_settings").insert({
        business_id: bizData.id, auto_reply_enabled: !!autoReply, ai_tone: "professional"
      });
      setShowBusinessSetup(false);
      setBusinessName(""); setBusinessCategory(""); setAutoReply("");
      fetchBusinessProfile();
      alert("Business profile created with AI Auto-Reply!");
    } catch (err: any) { alert("Failed to setup business: " + err.message); }
  };

  const startWatchingAd = (ad: AdCampaign) => {
    setWatchingAd(ad); setAdProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10; setAdProgress(progress);
      if (progress >= 100) { clearInterval(interval); claimReward(ad.id); }
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
        fetchWalletData();
      }, 1000);
    } catch (err: any) { alert(err.message || "You already watched this ad!"); setWatchingAd(null); }
  };

  const generateAISummary = () => {
    setAiSummary("🤖 AI is analyzing your chat...");
    setTimeout(() => { setAiSummary(`🤖 AI Summary: You exchanged ${messages.length} messages.`); }, 1500);
  };

  const handleCreatePost = async () => {    if (!postContent.trim() && !postImage) return;
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
      setShowCreatePost(false); setPostContent(""); setPostImage(null); setPostImagePreview(null);
      fetchFeedData();
    } catch (err: any) { alert("Failed to create post: " + err.message); }
    finally { setIsPosting(false); }
  };

  const handleLikePost = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    if (post.is_liked) {
      await supabase.from("post_likes").delete().eq("user_id", user.id).eq("post_id", postId);
      setPosts(posts.map(p => p.id === postId ? { ...p, is_liked: false, likes_count: (p.likes_count || 1) - 1 } : p));
    } else {
      await supabase.from("post_likes").insert({ user_id: user.id, post_id: postId });
      setPosts(posts.map(p => p.id === postId ? { ...p, is_liked: true, likes_count: (p.likes_count || 0) + 1 } : p));
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const { data } = await supabase.from("groups").insert({
        name: newGroupName, description: newGroupDesc, owner_id: user.id, group_type: "group"
      }).select().single();
      if (data) {
        await supabase.from("group_members").insert({ group_id: data.id, user_id: user.id, role: "owner" });
        setShowCreateGroup(false); setNewGroupName(""); setNewGroupDesc("");
        fetchGroups(); alert("Group created successfully!");
      }
    } catch (err: any) { alert("Failed to create group: " + err.message); }
  };

  const handleSearchUser = async () => {
    if (!searchUsername.trim()) return;
    const { data } = await supabase.from("profiles").select("*").eq("username", searchUsername.trim()).single();
    setSearchResult(data);  };

  const handleCreateChat = async (targetUserId: string) => {
    try {
      const { data: chat } = await supabase
        .from("chats")
        .insert({ name: `Chat with ${searchResult.display_name}`, created_by: user.id })
        .select()
        .single();

      if (chat) {
        await supabase.from("chat_members").insert([
          { chat_id: chat.id, user_id: user.id, role: "owner" },
          { chat_id: chat.id, user_id: targetUserId, role: "member" }
        ]);
        setShowNewChat(false);
        setSearchUsername("");
        setSearchResult(null);
        fetchChats();
        alert("Chat created successfully!");
      }
    } catch (err: any) { alert("Failed to create chat: " + err.message); }
  };

  const openChat = (chat: Chat) => { setActiveChatId(chat.id); setActiveChatName(chat.name); setView("conversation"); setAiSummary(null); };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#020617]"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>;
  if (!user) return null;

  return (
    <div className="relative min-h-screen w-full max-w-md mx-auto text-white overflow-hidden font-sans">
      <GChatBackground />

      {/* Render views based on state */}
      {view === "home" && <HomeView setView={setView} onLogout={() => supabase.auth.signOut()} />}
      {view === "list" && <ChatsListView setView={setView} chats={chats} onOpenChat={openChat} onNewChat={() => setShowNewChat(true)} />}
      {view === "conversation" && activeChatId && (
        <ConversationView
          setView={setView}
          activeChatName={activeChatName}
          messages={messages}
          userId={user.id}
          draft={draft}
          setDraft={setDraft}
          onSendMessage={sendMessage}
          onSendMoney={() => setShowSendMoney(true)}
          onAISummary={generateAISummary}
          aiSummary={aiSummary}
        />
      )}      {view === "feed" && <FeedView posts={posts} onLikePost={handleLikePost} onCreatePost={() => setShowCreatePost(true)} />}
      {view === "wallet" && <WalletView setView={setView} balance={walletBalance} ads={availableAds} transactions={transactions} userId={user.id} onWatchAd={startWatchingAd} onWithdraw={() => setShowWithdraw(true)} />}
      {view === "profile" && profile && <ProfileView profile={profile} setView={setView} onEdit={() => setView("edit-profile")} />}
      {view === "edit-profile" && (
        <EditProfileView
          setView={setView}
          editForm={editForm}
          setEditForm={setEditForm}
          avatarPreview={profileAvatarPreview}
          coverPreview={profileCoverPreview}
          onAvatarChange={(e) => { const f = e.target.files?.[0]; if(f) { setProfileAvatar(f); setProfileAvatarPreview(URL.createObjectURL(f)); }}}
          onCoverChange={(e) => { const f = e.target.files?.[0]; if(f) { setProfileCover(f); setProfileCoverPreview(URL.createObjectURL(f)); }}}
          onSave={handleSaveProfile}
        />
      )}
      {view === "analytics" && profile && <AnalyticsView setView={setView} profile={profile} walletBalance={walletBalance} />}
      {view === "settings" && <SettingsView setView={setView} onLogout={() => supabase.auth.signOut()} />}
      {view === "gtribe" && <GTribeView groups={groups} onCreateGroup={() => setShowCreateGroup(true)} />}
      {view === "gchatone" && <GChatOneView businessProfile={businessProfile} onSetupBusiness={() => setShowBusinessSetup(true)} />}

      {/* Notification Prompt */}
      <NotificationPrompt />

      {/* Modals */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setShowNewChat(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-[#0B1120] border border-white/10 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">New Chat</h3>
              <button onClick={() => setShowNewChat(false)} className="p-2 rounded-full hover:bg-white/5"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex gap-2 mb-4">
              <input value={searchUsername} onChange={(e) => setSearchUsername(e.target.value)} placeholder="Search username..." className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white" onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()} />
              <button onClick={handleSearchUser} className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400"><Search className="h-5 w-5" /></button>
            </div>
            {searchResult && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center font-bold">{searchResult.display_name?.charAt(0) || "U"}</div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{searchResult.display_name}</p>
                    <p className="text-xs text-gray-400">@{searchResult.username}</p>
                  </div>
                  <button onClick={() => handleCreateChat(searchResult.id)} className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold">Chat</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setShowWithdraw(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-[#0B1120] border border-white/10 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Withdraw Funds</h3>
            <p className="text-sm text-gray-400 mb-4">Available: ${(walletBalance / 100).toFixed(2)}</p>
            <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="Amount (USD)" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white mb-3" />
            <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Bank Name" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white mb-3" />
            <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Account Number" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white mb-3" />
            <input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Account Name" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setShowWithdraw(false)} className="flex-1 py-3 rounded-xl bg-white/5">Cancel</button>
              <button onClick={handleWithdraw} disabled={isWithdrawing} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 font-bold disabled:opacity-50">{isWithdrawing ? "Processing..." : "Withdraw"}</button>
            </div>
          </div>
        </div>
      )}

      {showBusinessSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setShowBusinessSetup(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-[#0B1120] border border-white/10 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-purple-400"/> Setup Business AI</h3>
            <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Business name" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white mb-3" />
            <input value={businessCategory} onChange={(e) => setBusinessCategory(e.target.value)} placeholder="Category" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white mb-3" />
            <textarea value={autoReply} onChange={(e) => setAutoReply(e.target.value)} placeholder="AI Auto-Reply message" className="w-full h-20 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white mb-4 resize-none" />
            <div className="flex gap-2">
              <button onClick={() => setShowBusinessSetup(false)} className="flex-1 py-3 rounded-xl bg-white/5">Cancel</button>
              <button onClick={handleSetupBusiness} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 font-bold">Setup</button>
            </div>
          </div>
        </div>
      )}

      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setShowCreateGroup(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-[#0B1120] border border-white/10 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Create Group</h3>
            <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Group name" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white mb-3" />
            <textarea value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} placeholder="Description" className="w-full h-20 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white mb-4 resize-none" />
            <div className="flex gap-2">
              <button onClick={() => setShowCreateGroup(false)} className="flex-1 py-3 rounded-xl bg-white/5">Cancel</button>
              <button onClick={handleCreateGroup} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 font-bold">Create</button>
            </div>
          </div>
        </div>
      )}

      {showCreatePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => !isPosting && setShowCreatePost(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-[#0B1120] border border-white/10 p-6" onClick={e => e.stopPropagation()}>            <div className="flex justify-between items-center mb-4">
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

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#020617]/95 backdrop-blur-xl border-t border-white/10 max-w-md mx-auto pb-safe">
        <div className="flex justify-around items-center h-16">
          <button onClick={() => setView("home")} className={`flex flex-col items-center gap-1 ${view === "home" ? "text-cyan-400" : "text-gray-500"}`}><MessageCircle className="h-5 w-5" /><span className="text-[9px]">Home</span></button>
          <button onClick={() => setView("list")} className={`flex flex-col items-center gap-1 ${view === "list" || view === "conversation" ? "text-cyan-400" : "text-gray-500"}`}><Users className="h-5 w-5" /><span className="text-[9px]">Chats</span></button>
          <button onClick={() => setView("feed")} className={`flex flex-col items-center gap-1 ${view === "feed" ? "text-cyan-400" : "text-gray-500"}`}><ImageIcon className="h-5 w-5" /><span className="text-[9px]">Feed</span></button>
          <button onClick={() => setView("wallet")} className={`flex flex-col items-center gap-1 ${view === "wallet" ? "text-cyan-400" : "text-gray-500"}`}><Wallet className="h-5 w-5" /><span className="text-[9px]">G-Pay</span></button>
          <button onClick={() => setView("profile")} className={`flex flex-col items-center gap-1 ${view === "profile" || view === "edit-profile" || view === "analytics" || view === "settings" ? "text-cyan-400" : "text-gray-500"}`}><User className="h-5 w-5" /><span className="text-[9px]">Profile</span></button>
        </div>      </nav>
    </div>
  );
}
