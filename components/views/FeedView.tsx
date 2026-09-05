"use client";

import { useEffect, useRef, useState } from "react";
import {
  Heart, MessageCircle, Share2, Bookmark, Eye, Send, Smile, MoreHorizontal,
  X, Image as ImageIcon, Music, UserPlus, MapPin, Sparkles, MessageSquare,
  Calendar, Video, Loader2, DollarSign
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { NatureBackground } from "../NatureBackground";
import "./gfeed.css";

const EMOJIS = ["❤️", "🔥", "⭐", "💎", "🎉", "🤯", "👏", "😂"];
const BURST_COLORS = ["#FFD700", "#00F0FF", "#FF2D95", "#B026FF", "#22c55e", "#FFF5E6"];

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

interface FeedViewProps { posts?: any[]; onLikePost?: (id: string) => void; onCreatePost?: () => void; }

export function FeedView(_: FeedViewProps) {
  const supabase = createClient();
  const [me, setMe] = useState("");
  const [profile, setProfile] = useState<any>(null);
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
  const [posting, setPosting] = useState(false);
  const holdTimer = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const say = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2200); };

  // ---- LOAD ----
  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setMe(user.id);

    const { data: prof } = await supabase
      .from("profiles")
      .select("display_name, username, avatar_url")
      .eq("id", user.id)
      .single();
    setProfile(prof);

    const { data: p } = await supabase
      .from("posts")
      .select("*, profiles:user_id(id, username, display_name, avatar_url, badges)")
      .eq("post_type", "post")
      .order("created_at", { ascending: false })
      .limit(30);
    
    if (!p) return;
    const ids = p.map((x: any) => x.id);

    const [r, c, b, l, t] = await Promise.all([
      supabase.from("post_reactions").select("*").in("post_id", ids),
      supabase.from("post_comments").select("*, profiles:user_id(username, display_name, avatar_url)").in("post_id", ids).order("created_at", { ascending: true }),
      supabase.from("post_bookmarks").select("post_id").eq("user_id", user.id).in("post_id", ids),
      supabase.from("post_likes").select("*").in("post_id", ids),
      supabase.from("post_tips").select("*").in("post_id", ids),
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

    p.slice(0, 10).forEach((post: any) => {
      const k = `gc_v_${post.id}`;
      if (!localStorage.getItem(k)) {
        localStorage.setItem(k, "1");
        supabase.rpc("bump_post", { target: post.id, field: "views" }).then(() => {});
      }
    });
  };

  useEffect(() => { load(); }, []);

  // ---- HELPERS ----
  const likesOf = (id: string) => likes.filter(l => l.post_id === id);
  const myLike = (id: string) => likes.some(l => l.post_id === id && l.user_id === me);
  const reactsOf = (id: string) => reactions.filter(r => r.post_id === id);
  const myReact = (id: string) => reactions.find(r => r.post_id === id && r.user_id === me);
  const commentsOf = (id: string) => comments.filter(c => c.post_id === id);
  const tipsOf = (id: string) => tips.filter(t => t.post_id === id).reduce((s, t) => s + Number(t.amount), 0);

  // ---- ACTIONS ----
  const toggleLike = async (id: string) => {
    if (myLike(id)) {
      setLikes(likes.filter(l => !(l.post_id === id && l.user_id === me)));
      await supabase.from("post_likes").delete().eq("post_id", id).eq("user_id", me);
    } else {
      setLikes([...likes, { post_id: id, user_id: me }]);
      setBurst(id); setTimeout(() => setBurst(null), 700);
      await supabase.from("post_likes").insert({ post_id: id, user_id: me });
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
    if (data) setComments([...comments, data]);
    setDraft("");
    setReplyTo(null);
  };

  const sendTip = async (id: string, cents: number) => {
    const { error } = await supabase.rpc("tip_post", { target: id, amt: cents });
    if (error) say("Tip failed: " + error.message);
    else {
      say(`You tipped $${(cents / 100).toFixed(2)} 💛`);
      setTips([...tips, { post_id: id, amount: cents }]);
    }
    setTipPost(null);
  };

  const share = async (p: any) => {
    try { await navigator.clipboard.writeText(p.content || "Check this out on G-Chat!"); } catch {}
    supabase.rpc("bump_post", { target: p.id, field: "shares" }).then(() => {});
    setPosts(posts.map(x => x.id === p.id ? { ...x, shares: (x.shares || 0) + 1 } : x));
    say("Shared — content copied ✨");
  };

  const toggleBookmark = async (id: string) => {
    if (bookmarks.includes(id)) {
      setBookmarks(bookmarks.filter(b => b !== id));
      await supabase.from("post_bookmarks").delete().eq("post_id", id).eq("user_id", me);
      say("Removed from bookmarks");
    } else {
      setBookmarks([...bookmarks, id]);
      await supabase.from("post_bookmarks").insert({ post_id: id, user_id: me });
      say("Saved for later 🔖");
    }
  };

  // ---- PUBLISH (Fixed: Button always clickable when text or image exists) ----
  const publish = async () => {
    // Check if there's content
    const hasContent = newText.trim().length > 0 || newImg !== null;
    
    if (!hasContent) {
      say("Please add some content or an image");
      return;
    }
    
    setPosting(true);
    let mediaUrl = null;
    
    try {
      if (newImg) {
        const fileExt = newImg.name.split('.').pop();
        const fileName = `${me}/posts/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("messages")
          .upload(fileName, newImg);
          
        if (uploadError) {
          throw new Error(uploadError.message);
        }
        
        if (uploadData) {
          const { data: urlData } = supabase.storage
            .from("messages")
            .getPublicUrl(uploadData.path);
          mediaUrl = urlData.publicUrl;
        }
      }

      const postData: any = {
        user_id: me,
        content: newText.trim() || "📷 Photo post",
        post_type: "post",
      };
      if (mediaUrl) postData.media_url = mediaUrl;

      const { error: insertError } = await supabase
        .from("posts")
        .insert(postData);

      if (insertError) throw new Error(insertError.message);

      setComposerOpen(false);
      setNewText("");
      setNewImg(null);
      setNewImgPrev(null);
      say("Posted to G-Feed 🌿");
      load();
      
    } catch (e: any) {
      console.error("Publish error:", e);
      say(`Post failed: ${e.message || 'Unknown error'}`);
    }
    setPosting(false);
  };

  // ---- SCORING ----
  const score = (p: any) => likesOf(p.id).length * 2 + commentsOf(p.id).length * 3 + (p.shares || 0) * 2;
  
  let feed = [...posts];
  if (tab === "trending") feed.sort((a, b) => score(b) - score(a));
  if (tab === "friends") feed = feed.filter(p => friendIds.includes(p.user_id) || p.user_id === me);
  if (tab === "explore") feed = feed.filter(p => !friendIds.includes(p.user_id) && p.user_id !== me);

  // Check if post button should be enabled
  const hasContent = newText.trim().length > 0 || newImg !== null;
  const isPostDisabled = posting || !hasContent;

  return (
    <div className="gfeed-wrap">
      <NatureBackground />

      {/* Header */}
      <div className="gfeed-head">
        <div className="flex items-center justify-between">
          <h1 className="gfeed-title">G-Feed</h1>
          <button onClick={() => setComposerOpen(true)} className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FFD700] to-[#00F0FF] text-black text-sm font-bold">
            Create Post
          </button>
        </div>
        <div className="gfeed-tabs">
          {([["foryou", "For You"], ["trending", "Trending"], ["friends", "Friends"], ["explore", "Explore"]] as any[]).map(([k, label]) => (
            <button key={k} className={`gfeed-tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{label}</button>
          ))}
        </div>
      </div>

      {/* Posts */}
      {feed.length === 0 && (
        <div className="text-center py-20 text-[rgba(255,245,230,0.5)]">
          <p className="text-lg mb-2">🌿 No posts yet</p>
          <p className="text-sm">Tap "Create Post" to share something!</p>
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

        return (
          <article key={p.id} className="post-card" style={{ animationDelay: `${Math.min(i, 8) * 0.06}s` }}>
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="ava-ring">
                <span className="ring offline" />
                <span className="face">
                  {author.avatar_url ? <img src={author.avatar_url} className="w-full h-full object-cover" alt="" /> :
                    (author.display_name || "U").charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: verified ? "#FFD700" : "#FFF5E6" }}>
                  {author.display_name || author.username || "User"} {verified && "✔"}
                </p>
                <p className="text-[11px] text-[rgba(255,245,230,0.5)]">{timeAgo(p.created_at)}</p>
              </div>
              <button className="eng-btn" onClick={() => say("Post options coming soon")}>
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            {p.content && <p className="mt-2 text-[15px] leading-relaxed text-[#FFF5E6] whitespace-pre-wrap">{linkify(p.content)}</p>}
            {p.media_url && (
              <img src={p.media_url} className="post-media" alt="" onClick={() => setLightbox(p.media_url)} />
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

              <button className={`eng-btn ${bookmarks.includes(p.id) ? "saved" : ""}`} onClick={() => toggleBookmark(p.id)}>
                <Bookmark className={`h-4 w-4 ${bookmarks.includes(p.id) ? "fill-current" : ""}`} />
              </button>

              <span className="eng-btn" style={{ cursor: "default" }}>
                <Eye className="h-4 w-4" /> {p.views || 0}
              </span>
            </div>

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
                    </div>
                    <button
                      className="text-[10px] text-[rgba(255,245,230,0.5)] mt-1"
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
                    className="flex-1 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-[13px] text-[#FFF5E6] outline-none"
                  />
                  <button className="eng-btn text-[#FFD700]" onClick={() => addComment(p.id)}>
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </article>
        );
      })}

      {/* ============================================================
         COMPOSER — FIXED with Working POST Button
         ============================================================ */}
      {composerOpen && (
        <div className="composer" onClick={() => !posting && setComposerOpen(false)}>
          <div className="composer-sheet" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#FFF5E6]">Create Post</h3>
              <button onClick={() => setComposerOpen(false)} className="p-2 rounded-full hover:bg-white/10">
                <X className="h-5 w-5 text-[#FFF5E6]" />
              </button>
            </div>

            {/* Profile Row */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-bold text-white overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  (profile?.display_name || "U").charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-[#FFF5E6]">{profile?.display_name || "User"}</p>
                <p className="text-[10px] text-[rgba(255,245,230,0.4)]">Public</p>
              </div>
            </div>

            {/* Text Input */}
            <textarea
              value={newText}
              onChange={e => setNewText(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full h-24 rounded-xl bg-transparent px-2 py-2 text-[#FFF5E6] text-base outline-none resize-none placeholder-[rgba(255,245,230,0.4)]"
            />

            {/* Image Preview */}
            {newImgPrev && (
              <div className="relative mt-2">
                <img src={newImgPrev} className="w-full max-h-64 object-cover rounded-xl" alt="" />
                <button
                  onClick={() => { setNewImg(null); setNewImgPrev(null); }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-1 mt-3 border-t border-[rgba(255,255,255,0.06)] pt-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <ImageIcon className="h-4 w-4 text-[#45BD62]" />
                <span className="text-xs text-[rgba(255,245,230,0.7)]">Photos/videos</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) { setNewImg(f); setNewImgPrev(URL.createObjectURL(f)); }
                }}
              />

              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors" onClick={() => say("Music feature coming soon 🎵")}>
                <Music className="h-4 w-4 text-[#F02849]" />
                <span className="text-xs text-[rgba(255,245,230,0.7)]">Music</span>
              </button>

              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors" onClick={() => say("Tag people coming soon")}>
                <UserPlus className="h-4 w-4 text-[#1877F2]" />
                <span className="text-xs text-[rgba(255,245,230,0.7)]">Tag people</span>
              </button>

              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors" onClick={() => say("Add location coming soon")}>
                <MapPin className="h-4 w-4 text-[#F3425F]" />
                <span className="text-xs text-[rgba(255,245,230,0.7)]">Add location</span>
              </button>

              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors" onClick={() => say("Feeling/activity coming soon")}>
                <Sparkles className="h-4 w-4 text-[#F7B928]" />
                <span className="text-xs text-[rgba(255,245,230,0.7)]">Feeling/activity</span>
              </button>

              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors" onClick={() => say("Get messages coming soon")}>
                <MessageSquare className="h-4 w-4 text-[#1877F2]" />
                <span className="text-xs text-[rgba(255,245,230,0.7)]">Get messages</span>
              </button>

              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors" onClick={() => say("Create event coming soon")}>
                <Calendar className="h-4 w-4 text-[#F02849]" />
                <span className="text-xs text-[rgba(255,245,230,0.7)]">Create event</span>
              </button>

              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors" onClick={() => say("Go live coming soon")}>
                <Video className="h-4 w-4 text-[#F02849]" />
                <span className="text-xs text-[rgba(255,245,230,0.7)]">Go live</span>
              </button>
            </div>

            {/* POST Button — FIXED: Always clickable when content exists */}
            <button
              disabled={isPostDisabled}
              onClick={publish}
              className={`w-full mt-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                isPostDisabled 
                  ? "bg-[rgba(255,255,255,0.1)] text-[rgba(255,245,230,0.3)] cursor-not-allowed" 
                  : "bg-gradient-to-r from-[#FFD700] to-[#00F0FF] text-black hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {posting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Posting...
                </span>
              ) : (
                "POST"
              )}
            </button>
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