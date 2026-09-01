"use client";

import { useEffect, useRef, useState } from "react";
import {
  Heart, MessageCircle, Share2, Bookmark, Eye, Send, Smile, MoreHorizontal,
  X, Image as ImageIcon, BarChart3, Zap, Flame, RefreshCw, Trophy, DollarSign,
  Volume2, Mic, Calendar, Users as UsersIcon, TrendingUp, Sparkles, Leaf,
  Palette, Moon, Sun, Award, ChevronDown, ChevronUp, Gift, Star, Clock
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { NatureBackground } from "../NatureBackground";
import imageCompression from "browser-image-compression";
import "./gfeed.css";

const EMOJIS = ["❤️", "🔥", "⭐", "💎", "🎉", "🤯", "👏", "😂"];
const BURST_COLORS = ["#FFD700", "#00F0FF", "#FF2D95", "#B026FF", "#22c55e", "#FFF5E6"];
const MOODS = ["😊 Happy", "🌧️ Deep", "🎉 Celebratory", "💡 Educational", "🔥 Hype", "💛 Heartfelt"];

const timeAgo = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  const d = new Date(iso);
  if (d.toDateString() === new Date().toDateString()) return `Today ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const linkify = (text: string) =>
  text.split(/(https?:\/\/[^\s]+)/g).map((p, i) =>
    p.match(/^https?:\/\//)
      ? <a key={i} href={p} target="_blank" rel="noreferrer" className="gfeed-link">{p.length > 40 ? p.slice(0, 37) + "…" : p}</a>
      : <span key={i}>{p}</span>
  );

const streakOf = (days: string[]) => {
  let streak = 0; const d = new Date();
  if (!days.includes(d.toDateString())) d.setDate(d.getDate() - 1);
  while (days.includes(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
};

interface FeedViewProps { posts?: any[]; onLikePost?: (id: string) => void; onCreatePost?: () => void; }

export function FeedView(_: FeedViewProps) {
  const supabase = createClient();
  const [me, setMe] = useState("");
  const [tab, setTab] = useState<"foryou" | "trending" | "friends" | "explore">("foryou");
  const [posts, setPosts] = useState<any[]>([]);
  const [likes, setLikes] = useState<any[]>([]);
  const [reactions, setReactions] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [tips, setTips] = useState<any[]>([]);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [wheelPost, setWheelPost] = useState<string | null>(null);
  const [burst, setBurst] = useState<string | null>(null);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [tipPost, setTipPost] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [newText, setNewText] = useState("");
  const [newImg, setNewImg] = useState<File | null>(null);
  const [newImgPrev, setNewImgPrev] = useState<string | null>(null);
  const [pollMode, setPollMode] = useState(false);
  const [pollOpts, setPollOpts] = useState<string[]>(["", ""]);
  const [posting, setPosting] = useState(false);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const [moodFilter, setMoodFilter] = useState<string | null>(null);
  const [showHeatMap, setShowHeatMap] = useState<string | null>(null);
  const [liveViewers, setLiveViewers] = useState<Record<string, any[]>>({});
  const [selectedMood, setSelectedMood] = useState("😊");
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [collectionName, setCollectionName] = useState("Saved");
  const [showCollections, setShowCollections] = useState(false);
  const [recordingVoice, setRecordingVoice] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [voiceDraft, setVoiceDraft] = useState<Blob | null>(null);
  const [achievementUnlocked, setAchievementUnlocked] = useState<string | null>(null);
  const holdTimer = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const say = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2200); };

  /* ---------- load everything ---------- */
  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setMe(user.id);

    // FIXED: Removed .eq("is_published", true) to show all posts
    const { data: p } = await supabase
      .from("posts")
      .select("*, profiles:user_id(id, username, display_name, avatar_url, badges)")
      .eq("post_type", "post")
      .order("created_at", { ascending: false })
      .limit(30);
    
    if (!p || p.length === 0) {
      console.log("No posts found");
      setPosts([]);
      return;
    }
    
    const ids = p.map((x: any) => x.id);

    const [r, c, b, l, t, ach] = await Promise.all([
      supabase.from("post_reactions").select("*").in("post_id", ids),
      supabase.from("post_comments").select("*, profiles:user_id(username, display_name, avatar_url)").in("post_id", ids).order("created_at", { ascending: true }),
      supabase.from("post_bookmarks").select("post_id").eq("user_id", user.id).in("post_id", ids),
      supabase.from("post_likes").select("*").in("post_id", ids),
      supabase.from("post_tips").select("*").in("post_id", ids),
      supabase.from("user_achievements").select("achievement").eq("user_id", user.id),
    ]);

    const myChats = await supabase.from("chat_members").select("chat_id").eq("user_id", user.id);
    const cids = (myChats.data || []).map((x: any) => x.chat_id);
    let fids: string[] = [];
    if (cids.length) {
      const mem = await supabase.from("chat_members").select("user_id").in("chat_id", cids).neq("user_id", user.id);
      fids = (mem.data || []).map((x: any) => x.user_id);
    }

    setReactions(r.data || []);
    setComments(c.data || []);
    setBookmarks((b.data || []).map((x: any) => x.post_id));
    setLikes(l.data || []);
    setTips(t.data || []);
    setFriendIds(fids);
    setPosts(p);
    setAchievements((ach.data || []).map((a: any) => a.achievement));

    // Live viewers simulation
    const viewerData: Record<string, any[]> = {};
    p.slice(0, 5).forEach((post: any) => {
      viewerData[post.id] = Array.from({ length: Math.floor(Math.random() * 4) + 1 }, () => ({
        id: Math.random().toString(36).substr(2, 9),
        display_name: ["Sarah", "Mike", "Alex", "Jenna", "Chris", "Taylor", "Jordan", "Riley"][Math.floor(Math.random() * 8)],
        avatar_url: null
      }));
    });
    setLiveViewers(viewerData);

    // Count views
    p.slice(0, 10).forEach((post: any) => {
      const k = `gc_v_${post.id}`;
      if (!localStorage.getItem(k)) {
        localStorage.setItem(k, "1");
        supabase.rpc("bump_post", { target: post.id, field: "views" }).then(() => {});
      }
    });

    // Check for new achievements
    await supabase.rpc("check_achievements", { user_id: user.id });
  };

  useEffect(() => { load(); }, []);

  /* ---------- derived helpers ---------- */
  const likesOf = (id: string) => likes.filter(l => l.post_id === id);
  const myLike = (id: string) => likes.some(l => l.post_id === id && l.user_id === me);
  const reactsOf = (id: string) => reactions.filter(r => r.post_id === id);
  const myReact = (id: string) => reactions.find(r => r.post_id === id && r.user_id === me);
  const commentsOf = (id: string) => comments.filter(c => c.post_id === id);
  const tipsOf = (id: string) => tips.filter(t => t.post_id === id).reduce((s, t) => s + Number(t.amount), 0);
  const score = (p: any) => likesOf(p.id).length * 2 + commentsOf(p.id).length * 3 + (p.shares || 0) * 2;

  /* ---------- actions ---------- */
  const toggleLike = async (id: string) => {
    if (myLike(id)) {
      setLikes(likes.filter(l => !(l.post_id === id && l.user_id === me)));
      await supabase.from("post_likes").delete().eq("post_id", id).eq("user_id", me);
    } else {
      setLikes([...likes, { post_id: id, user_id: me }]);
      setBurst(id); setTimeout(() => setBurst(null), 700);
      await supabase.from("post_likes").insert({ post_id: id, user_id: me });
      await supabase.rpc("check_achievements", { user_id: me });
    }
  };

  const react = async (id: string, emoji: string) => {
    const cur = myReact(id);
    if (cur && cur.reaction === emoji) {
      setReactions(reactions.filter(r => !(r.post_id === id && r.user_id === me)));
      await supabase.from("post_reactions").delete().eq("post_id", id).eq("user_id", me);
    } else {
      const next = { post_id: id, user_id: me, reaction: emoji };
      setReactions([...reactions.filter(r => !(r.post_id === id && r.user_id === me)), next]);
      await supabase.from("post_reactions").upsert(next, { onConflict: "user_id,post_id" });
    }
    setWheelPost(null);
  };

  const addComment = async (id: string) => {
    const text = draft.trim();
    if (!text) return;
    const { data } = await supabase.from("post_comments")
      .insert({ post_id: id, user_id: me, content: text, parent_id: replyTo?.id || null })
      .select("*, profiles:user_id(username, display_name, avatar_url)")
      .single();
    if (data) {
      setComments([...comments, data]);
      await supabase.rpc("check_achievements", { user_id: me });
    }
    setDraft("");
    setReplyTo(null);
  };

  const sendTip = async (id: string, cents: number) => {
    const { error } = await supabase.rpc("tip_post", { target: id, amt: cents });
    if (error) say("Tip failed: " + error.message);
    else {
      say(`You tipped $${(cents / 100).toFixed(2)} 💛`);
      setTips([...tips, { post_id: id, amount: cents }]);
      await supabase.rpc("check_achievements", { user_id: me });
    }
    setTipPost(null);
  };

  const share = async (p: any) => {
    try { await navigator.clipboard.writeText(p.content || "Check this out on G-Chat!"); } catch {}
    supabase.rpc("bump_post", { target: p.id, field: "shares" }).then(() => {});
    setPosts(posts.map(x => x.id === p.id ? { ...x, shares: (x.shares || 0) + 1 } : x));
    say("Shared — content copied ✨");
  };

  const toggleBookmark = async (id: string, collection?: string) => {
    const col = collection || "Saved";
    if (bookmarks.includes(id)) {
      setBookmarks(bookmarks.filter(b => b !== id));
      await supabase.from("post_bookmarks").delete().eq("post_id", id).eq("user_id", me);
      say("Removed from bookmarks");
    } else {
      setBookmarks([...bookmarks, id]);
      await supabase.from("post_bookmarks").insert({ post_id: id, user_id: me, collection: col });
      say(`Saved to "${col}" 🔖`);
    }
  };

  const vote = async (id: string, idx: number) => {
    await supabase.rpc("vote_poll", { target: id, opt: idx });
    setPosts(posts.map(p => {
      if (p.id !== id || !p.poll_data) return p;
      const options = p.poll_data.options.map((o: any, i: number) => i === idx ? { ...o, votes: (o.votes || 0) + 1 } : o);
      return { ...p, poll_data: { ...p.poll_data, options } };
    }));
  };

  const startVoiceRecording = async (postId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setVoiceDraft(blob);
        say("Voice note recorded 🎤");
      };
      recorder.start();
      setMediaRecorder(recorder);
      setRecordingVoice(postId);
    } catch (e) {
      say("Microphone access denied");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setRecordingVoice(null);
      setMediaRecorder(null);
    }
  };

  const publish = async () => {
    if (!newText.trim() && !newImg && !voiceDraft) return;
    setPosting(true);
    let mediaUrl = null;
    let voiceUrl = null;
    try {
      if (newImg) {
        const cf = await imageCompression(newImg, { maxSizeMB: 2, maxWidthOrHeight: 1920 });
        const fn = `${me}/posts/${Date.now()}.${cf.name.split(".").pop()}`;
        const { data: up, error: uploadError } = await supabase.storage.from("messages").upload(fn, cf);
        if (uploadError) throw uploadError;
        if (up) {
          const { data: urlData } = supabase.storage.from("messages").getPublicUrl(up.path);
          mediaUrl = urlData.publicUrl;
        }
      }

      if (voiceDraft) {
        const fn = `${me}/voice/${Date.now()}.webm`;
        const { data: up, error: uploadError } = await supabase.storage.from("messages").upload(fn, voiceDraft);
        if (uploadError) throw uploadError;
        if (up) {
          const { data: urlData } = supabase.storage.from("messages").getPublicUrl(up.path);
          voiceUrl = urlData.publicUrl;
        }
      }

      const opts = pollOpts.filter(o => o.trim()).map(o => ({ text: o.trim(), votes: 0 }));
      const { error: insertError } = await supabase.from("posts").insert({
        user_id: me,
        content: newText.trim(),
        media_url: mediaUrl,
        voice_url: voiceUrl,
        post_type: "post",
        poll_data: pollMode && opts.length >= 2 ? { options: opts } : null,
        mood: selectedMood,
      });

      if (insertError) throw insertError;

      await supabase.rpc("check_achievements", { user_id: me });

      setComposerOpen(false);
      setNewText("");
      setNewImg(null);
      setNewImgPrev(null);
      setPollMode(false);
      setPollOpts(["", ""]);
      setVoiceDraft(null);
      setSelectedMood("😊");
      say("Posted to G-Feed 🌿");
      load();
    } catch (e: any) {
      say("Post failed: " + e.message);
    }
    setPosting(false);
  };

  const pullToRefresh = async () => {
    setIsRefreshing(true);
    await load();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  /* ---------- gamification ---------- */
  const myPosts = posts.filter(p => p.user_id === me);
  const likesRec = likes.filter(l => myPosts.some(p => p.id === l.post_id)).length;
  const xp = myPosts.length * 10 + likesRec * 2 + comments.filter(c => myPosts.some(p => p.id === c.post_id)).length * 3;
  const level = Math.floor(xp / 50) + 1;
  const prog = (xp % 50) / 50;
  const streak = streakOf([...new Set(myPosts.map(p => new Date(p.created_at).toDateString()))]);

  /* ---------- filter ---------- */
  let feed = [...posts];
  if (moodFilter) {
    feed = feed.filter(p => p.mood === moodFilter);
  }
  if (tab === "trending") feed.sort((a, b) => score(b) - score(a));
  if (tab === "friends") feed = feed.filter(p => friendIds.includes(p.user_id) || p.user_id === me);
  if (tab === "explore") feed = feed.filter(p => !friendIds.includes(p.user_id) && p.user_id !== me);

  return (
    <div className="gfeed-wrap" ref={scrollRef}>
      <NatureBackground />

      {/* Pull to refresh indicator */}
      {isRefreshing && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-30 bg-[rgba(255,215,0,0.15)] px-4 py-2 rounded-full border border-[rgba(255,215,0,0.3)] backdrop-blur-xl">
          <RefreshCw className="h-4 w-4 animate-spin text-[#FFD700]" />
        </div>
      )}

      {/* Achievement Unlocked Toast */}
      {achievementUnlocked && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-[rgba(255,215,0,0.2)] px-6 py-3 rounded-full border-2 border-[#FFD700] backdrop-blur-xl animate-bounce">
          <span className="text-[#FFD700] font-bold">🏆 Achievement Unlocked: {achievementUnlocked}</span>
        </div>
      )}

      {/* Header */}
      <div className="gfeed-head">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="gfeed-title">G-Feed 🌿</h1>
            <button
              onClick={() => setShowAchievements(!showAchievements)}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <Award className="h-4 w-4 text-[#FFD700]" />
            </button>
          </div>
          <div className="xp-pill">
            <Trophy className="h-3.5 w-3.5 text-[#FFD700]" /> Lv {level}
            <span className="xp-bar"><span className="xp-fill" style={{ width: `${prog * 100}%` }} /></span>
            {streak >= 2 && <span className="text-[#FFB800]">🔥{streak}</span>}
            <button onClick={pullToRefresh} className="p-1 rounded-full hover:bg-white/10 transition-transform hover:rotate-180">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Achievements */}
        {showAchievements && achievements.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {achievements.map((a, i) => (
              <span key={i} className="badge-chip animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
                {a}
              </span>
            ))}
          </div>
        )}

        {/* Mood Filter */}
        <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-none pb-1">
          {MOODS.map(m => (
            <button
              key={m}
              className={`text-[10px] px-3 py-1 rounded-full border transition-all whitespace-nowrap ${
                moodFilter === m ? "border-[#FFD700] text-[#FFD700] bg-[rgba(255,215,0,0.1)]" :
                "border-[rgba(255,215,0,0.15)] text-[rgba(255,245,230,0.5)] hover:border-[rgba(255,215,0,0.3)]"
              }`}
              onClick={() => setMoodFilter(moodFilter === m ? null : m)}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="gfeed-tabs">
          {([["foryou", "✨ For You"], ["trending", "⚡ Trending"], ["friends", "🤝 Friends"], ["explore", "🧭 Explore"]] as any[]).map(([k, label]) => (
            <button key={k} className={`gfeed-tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      {feed.length === 0 && (
        <div className="text-center py-20 text-[rgba(255,245,230,0.5)]">
          <p className="text-lg mb-2">🌿 No posts yet</p>
          <p className="text-sm">Tap the ✨ button to create your first post!</p>
        </div>
      )}
      
      {feed.map((p, i) => {
        const author = p.profiles || {};
        const verified = Array.isArray(author.badges) && author.badges.includes("Verified");
        const lk = likesOf(p.id).length;
        const cm = commentsOf(p.id);
        const top = cm.filter((c: any) => !c.parent_id);
        const rx = reactsOf(p.id);
        const rxCount: Record<string, number> = {};
        rx.forEach((r: any) => { rxCount[r.reaction] = (rxCount[r.reaction] || 0) + 1; });
        const totalVotes = p.poll_data ? p.poll_data.options.reduce((s: number, o: any) => s + (o.votes || 0), 0) : 0;
        const viewers = liveViewers[p.id] || [];

        return (
          <article key={p.id} className="post-card" style={{ animationDelay: `${Math.min(i, 8) * 0.06}s` }}>
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="ava-ring">
                <span className={`ring ${!viewers.length ? "offline" : ""}`} />
                <span className="face">
                  {author.avatar_url ? <img src={author.avatar_url} className="w-full h-full object-cover" alt="" /> :
                    (author.display_name || "U").charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: verified ? "#FFD700" : "#FFF5E6" }}>
                  {author.display_name || author.username || "User"} {verified && "✔"}
                  {p.mood && <span className="ml-1 text-xs">{p.mood}</span>}
                </p>
                <p className="text-[11px] text-[rgba(255,245,230,0.5)]">{timeAgo(p.created_at)} · @{author.username}</p>
              </div>
              <button className="eng-btn" onClick={() => say("Post options coming soon")}>
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            {/* Live Viewers */}
            {viewers.length > 0 && (
              <div className="live-viewers">
                {viewers.slice(0, 3).map((v: any, idx: number) => (
                  <div key={v.id} className="live-avatar" style={{ animationDelay: `${idx * 0.5}s` }}>
                    <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-white">
                      {v.display_name.charAt(0)}
                    </div>
                  </div>
                ))}
                {viewers.length > 3 && (
                  <span className="text-[10px] text-[rgba(255,245,230,0.4)]">+{viewers.length - 3}</span>
                )}
                <span className="text-[10px] text-[rgba(255,245,230,0.4)] ml-1">watching</span>
              </div>
            )}

            {/* Content */}
            {p.content && <p className="mt-2 text-[15px] leading-relaxed text-[#FFF5E6] whitespace-pre-wrap">{linkify(p.content)}</p>}

            {/* Voice Note */}
            {p.voice_url && (
              <div className="mt-2 p-3 rounded-xl bg-[rgba(0,240,255,0.08)] border border-[rgba(0,240,255,0.15)] flex items-center gap-3">
                <Volume2 className="h-4 w-4 text-[#00F0FF]" />
                <audio src={p.voice_url} controls className="h-8 w-full max-w-[200px]" />
              </div>
            )}

            {/* Media */}
            {p.media_url && (
              <img src={p.media_url} className="post-media" alt="" onClick={() => setLightbox(p.media_url)} />
            )}

            {/* Poll */}
            {p.poll_data && (
              <div className="mt-2">
                {p.poll_data.options.map((o: any, idx: number) => {
                  const pct = totalVotes ? Math.round(((o.votes || 0) / totalVotes) * 100) : 0;
                  return (
                    <button key={idx} className="poll-opt" onClick={() => vote(p.id, idx)}>
                      <span className="poll-fill" style={{ "--w": `${pct}%` } as React.CSSProperties} />
                      <span className="relative flex justify-between"><span>{o.text}</span><span>{pct}%</span></span>
                    </button>
                  );
                })}
                <p className="text-[10px] mt-1 text-[rgba(255,245,230,0.5)]">{totalVotes} votes · tap to vote</p>
              </div>
            )}

            {/* Heat Map Toggle */}
            <button
              className="text-[10px] text-[rgba(255,245,230,0.3)] mt-1 hover:text-[rgba(255,245,230,0.5)] transition-colors"
              onClick={() => setShowHeatMap(showHeatMap === p.id ? null : p.id)}
            >
              {showHeatMap === p.id ? "Hide" : "Show"} engagement heat map
            </button>

            {showHeatMap === p.id && (
              <div className="mt-2">
                <div className="heat-map">
                  {Array.from({ length: 24 }).map((_, h) => {
                    const height = Math.random() * 80 + 10;
                    return <div key={h} className="heat-bar" style={{ height: `${height}%` }} />;
                  })}
                </div>
                <p className="text-[8px] text-[rgba(255,245,230,0.2)] mt-1">Last 24 hours · Activity heat map</p>
              </div>
            )}

            {/* Reactions display */}
            {Object.keys(rxCount).length > 0 && (
              <div className="mt-2">
                {Object.entries(rxCount).slice(0, 4).map(([e, n]) => (
                  <span key={e} className="react-chip">{e} {n}</span>
                ))}
                {Object.keys(rxCount).length > 4 && (
                  <span className="react-chip">+{Object.keys(rxCount).length - 4}</span>
                )}
              </div>
            )}

            {/* Engagement Bar */}
            <div className="eng-bar">
              <button
                className={`eng-btn ${myLike(p.id) ? "liked" : ""}`}
                onContextMenu={e => e.preventDefault()}
                onPointerDown={() => { holdTimer.current = setTimeout(() => setWheelPost(p.id), 400); }}
                onPointerUp={() => { clearTimeout(holdTimer.current); if (wheelPost !== p.id) toggleLike(p.id); }}
                onPointerLeave={() => clearTimeout(holdTimer.current)}
              >
                <Heart className={`h-4 w-4 ${myLike(p.id) ? "fill-current" : ""}`} /> {lk}
                {burst === p.id && (
                  <span className="burst">
                    {BURST_COLORS.map((c, j) => (
                      <i key={j} style={{ background: c, "--dx": `${Math.cos(j) * 26}px`, "--dy": `${Math.sin(j) * 26}px` } as React.CSSProperties} />
                    ))}
                  </span>
                )}
                {wheelPost === p.id && (
                  <span className="rw">
                    {EMOJIS.map((e, j) => (
                      <button key={e} className="rw-item" style={{ transform: `rotate(${j * 24 - 84}deg) translateY(-52px) rotate(${84 - j * 24}deg)` }} onClick={() => react(p.id, e)}>
                        <span style={{ animationDelay: `${j * 0.03}s` }}>{e}</span>
                      </button>
                    ))}
                  </span>
                )}
              </button>

              <button className="eng-btn" onClick={() => setOpenComments(openComments === p.id ? null : p.id)}>
                <MessageCircle className="h-4 w-4" /> {cm.length}
              </button>

              <button className="eng-btn" onClick={() => share(p)}>
                <Share2 className="h-4 w-4" /> {p.shares || 0}
              </button>

              <button className="eng-btn" onClick={() => setTipPost(tipPost === p.id ? null : p.id)}>
                <DollarSign className="h-4 w-4 text-[#22c55e]" /> {tipsOf(p.id) > 0 ? `$${(tipsOf(p.id) / 100).toFixed(2)}` : "Tip"}
              </button>

              <button
                className={`eng-btn ${bookmarks.includes(p.id) ? "saved" : ""}`}
                onClick={() => {
                  if (bookmarks.includes(p.id)) {
                    toggleBookmark(p.id);
                  } else {
                    setShowCollections(true);
                    (window as any)._bookmarkPostId = p.id;
                  }
                }}
              >
                <Bookmark className={`h-4 w-4 ${bookmarks.includes(p.id) ? "fill-current" : ""}`} />
              </button>

              <span className="eng-btn" style={{ cursor: "default" }}>
                <Eye className="h-4 w-4" /> {p.views || 0}
              </span>
            </div>

            {/* Collection picker */}
            {showCollections && (window as any)._bookmarkPostId === p.id && (
              <div className="mt-2 flex gap-2">
                {["Saved", "Read Later", "Inspiration", "Watch"].map(col => (
                  <button
                    key={col}
                    className="text-[10px] px-3 py-1 rounded-full border border-[rgba(255,215,0,0.2)] hover:border-[#FFD700] transition-colors"
                    onClick={() => {
                      toggleBookmark(p.id, col);
                      setShowCollections(false);
                      (window as any)._bookmarkPostId = null;
                    }}
                  >
                    📁 {col}
                  </button>
                ))}
              </div>
            )}

            {/* Tip popover */}
            {tipPost === p.id && (
              <div className="flex gap-2 mt-2">
                {[50, 100, 250, 500].map(c => (
                  <button key={c} className="poll-opt !mt-0 flex-1 text-center" onClick={() => sendTip(p.id, c)}>
                    💛 ${(c / 100).toFixed(2)}
                  </button>
                ))}
              </div>
            )}

            {/* Comments */}
            {openComments === p.id && (
              <div className="mt-3 space-y-2">
                {top.slice(-3).map((c: any) => (
                  <div key={c.id} className="cmt">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-[11px] font-bold text-[#FFD700]">
                        {c.profiles?.display_name || c.profiles?.username}
                      </p>
                      <p className="text-[13px] text-[#FFF5E6]">{c.content}</p>
                      <p className="text-[9px] text-[rgba(255,245,230,0.3)] mt-1">{timeAgo(c.created_at)}</p>
                    </div>
                    {cm.filter((r: any) => r.parent_id === c.id).map((r: any) => (
                      <div key={r.id} className="cmt cmt-reply mt-1 p-2 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-[10px] font-bold text-[#00F0FF]">
                          {r.profiles?.display_name || r.profiles?.username}
                        </p>
                        <p className="text-[12px] text-[#FFF5E6]">{r.content}</p>
                      </div>
                    ))}
                    <button
                      className="text-[10px] text-[rgba(255,245,230,0.5)] mt-1 hover:text-[rgba(255,245,230,0.8)] transition-colors"
                      onClick={() => setReplyTo({ id: c.id, name: c.profiles?.display_name || "user" })}
                    >
                      Reply
                    </button>
                  </div>
                ))}
                {top.length > 3 && (
                  <p className="text-[11px] text-[#00F0FF] cursor-pointer hover:underline">
                    View all {top.length} comments
                  </p>
                )}

                {/* Comment input */}
                <div className="flex items-center gap-2 mt-1">
                  {replyTo && (
                    <span className="text-[10px] text-[#00F0FF] flex items-center gap-1">
                      ↩ {replyTo.name}
                      <button onClick={() => setReplyTo(null)} className="text-[rgba(255,245,230,0.3)] hover:text-[rgba(255,245,230,0.6)]">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  <input
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addComment(p.id)}
                    placeholder={replyTo ? "Write a reply..." : "Add a comment..."}
                    className="flex-1 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-[13px] text-[#FFF5E6] outline-none focus:border-[rgba(255,215,0,0.3)] transition-colors"
                  />
                  <button className="eng-btn" onClick={() => setDraft(draft + "😊")}>
                    <Smile className="h-4 w-4" />
                  </button>
                  <button
                    className="eng-btn text-[#FFD700]"
                    onClick={() => {
                      if (recordingVoice === p.id) {
                        stopVoiceRecording();
                      } else {
                        startVoiceRecording(p.id);
                      }
                    }}
                  >
                    <Mic className={`h-4 w-4 ${recordingVoice === p.id ? "text-[#FF2D95] animate-pulse" : ""}`} />
                  </button>
                  <button className="eng-btn text-[#FFD700]" onClick={() => addComment(p.id)}>
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                {recordingVoice === p.id && (
                  <p className="text-[10px] text-[#FF2D95] animate-pulse">🔴 Recording voice comment...</p>
                )}
              </div>
            )}
          </article>
        );
      })}

      {/* FAB composer */}
      <button className="gfeed-fab" aria-label="Create post" onClick={() => setComposerOpen(true)}>
        <ImageIcon className="h-5 w-5" />
      </button>

      {/* ============================================================
         COMPOSER — FIXED with VISIBLE Buttons
         ============================================================ */}
      {composerOpen && (
        <div className="composer" onClick={() => !posting && setComposerOpen(false)}>
          <div className="composer-sheet" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="gfeed-title text-base">Create Post</h3>
              <button onClick={() => setComposerOpen(false)} className="p-2 rounded-full hover:bg-white/10">
                <X className="h-5 w-5 text-[#FFF5E6]" />
              </button>
            </div>

            {/* Mood Picker */}
            <div className="flex gap-1 mb-3 overflow-x-auto scrollbar-none">
              {MOODS.map(m => (
                <button
                  key={m}
                  className={`text-[10px] px-2 py-1 rounded-full border transition-all whitespace-nowrap ${
                    selectedMood === m.split(" ")[0] ?
                      "border-[#FFD700] text-[#FFD700] bg-[rgba(255,215,0,0.1)]" :
                      "border-[rgba(255,215,0,0.15)] text-[rgba(255,245,230,0.4)]"
                  }`}
                  onClick={() => setSelectedMood(m.split(" ")[0])}
                >
                  {m}
                </button>
              ))}
            </div>

            <textarea
              value={newText}
              onChange={e => setNewText(e.target.value)}
              placeholder="Share something beautiful..."
              className="w-full h-24 rounded-xl bg-white/5 border border-[rgba(255,215,0,0.2)] px-4 py-3 text-[#FFF5E6] outline-none resize-none focus:border-[rgba(255,215,0,0.4)] transition-colors"
            />

            {newImgPrev && <img src={newImgPrev} className="post-media" alt="" />}

            {/* Voice recording in composer */}
            <div className="mt-2 flex items-center gap-2">
              <button
                className={`eng-btn ${recordingVoice === "composer" ? "text-[#FF2D95]" : ""}`}
                onClick={() => {
                  if (recordingVoice === "composer") {
                    stopVoiceRecording();
                  } else {
                    startVoiceRecording("composer");
                    setRecordingVoice("composer");
                  }
                }}
              >
                <Mic className={`h-4 w-4 ${recordingVoice === "composer" ? "animate-pulse" : ""}`} />
                {voiceDraft ? "🎤 Recorded" : "Voice"}
              </button>
              {voiceDraft && (
                <span className="text-[10px] text-[rgba(255,245,230,0.4)]">Voice note ready</span>
              )}
            </div>

            {pollMode && (
              <div className="mt-2 space-y-2">
                {pollOpts.map((o, i) => (
                  <input
                    key={i}
                    value={o}
                    onChange={e => setPollOpts(pollOpts.map((x, j) => j === i ? e.target.value : x))}
                    placeholder={`Option ${i + 1}`}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-[13px] text-[#FFF5E6] outline-none focus:border-[rgba(255,215,0,0.3)] transition-colors"
                  />
                ))}
                {pollOpts.length < 4 && (
                  <button
                    className="text-[11px] text-[#00F0FF] hover:underline transition-colors"
                    onClick={() => setPollOpts([...pollOpts, ""])}
                  >
                    + Add option
                  </button>
                )}
              </div>
            )}

            {/* ==========================================================
               FIXED: Buttons are now VISIBLE with proper styling
               ========================================================== */}
            <div className="flex gap-2 mt-3">
              {/* Photo Button */}
              <button 
                className="eng-btn" 
                onClick={() => document.getElementById("gfeed-img")?.click()}
              >
                <ImageIcon className="h-4 w-4" /> Photo
              </button>
              
              {/* Poll Button */}
              <button
                className={`eng-btn ${pollMode ? "text-[#FFD700]" : ""}`}
                onClick={() => setPollMode(!pollMode)}
              >
                <BarChart3 className="h-4 w-4" /> Poll
              </button>
              
              {/* POST BUTTON - BIG and VISIBLE */}
              <button
                disabled={posting}
                onClick={publish}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#00F0FF] text-black font-bold text-sm disabled:opacity-50 hover:scale-105 transition-transform"
              >
                {posting ? "Posting..." : "Post ✨"}
              </button>
            </div>

            <input
              id="gfeed-img"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) { setNewImg(f); setNewImgPrev(URL.createObjectURL(f)); }
              }}
            />
          </div>
        </div>
      )}

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" />
        </div>
      )}

      {toast && <div className="gfeed-toast">{toast}</div>}
    </div>
  );
}