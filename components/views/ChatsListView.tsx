"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, Search, Mic, Image as ImageIcon, QrCode, Link2, Users2, Megaphone,
  Ghost, Building2, LifeBuoy, Sparkles, X, Pin, BellOff, Archive, Trash2, Flame, Zap
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import "./chat-hub.css";

type Chat = { id: string; name: string; updated_at: string };
type View = "home" | "list" | "conversation" | "wallet" | "feed" | "gtribe" | "gchatone" | "profile" | "edit-profile" | "analytics" | "settings";
type Enriched = Chat & {
  lastText?: string; lastAt?: string; lastMine?: boolean; count: number; unread: number;
  pinned: boolean; muted: boolean; archived: boolean; score: number; mood: string;
  streak: number; online: boolean; lastFew: string[];
};

interface Props {
  setView: (v: View) => void;
  chats: Chat[];
  onOpenChat: (c: Chat) => void;
  onNewChat: () => void;
}

/* ---------- helpers ---------- */
const readLS = (k: string, fb: string[]): string[] => {
  try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return fb; }
};
const writeLS = (k: string, v: string[]): void => localStorage.setItem(k, JSON.stringify(v));
const hash = (s: string): number => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997; return h; };

const moodOf = (text?: string): string => {
  if (!text) return "💬";
  const t = text.toLowerCase();
  if (/\$|pay|money|bank|earn|sent/.test(t)) return "💰";
  if (/(love|happy|great|good|thanks|yes|nice|🎉)/.test(t)) return "😊";
  if (/(where|location|meet|address|map)/.test(t)) return "📍";
  if (/(sad|sorry|bad|angry)/.test(t)) return "🌧️";
  return "💬";
};

const streakOf = (msgs: any[]): number => {
  const days = [...new Set(msgs.map((m: any) => new Date(m.created_at).toDateString()))];
  let streak = 0; const d = new Date();
  if (!days.includes(d.toDateString())) d.setDate(d.getDate() - 1);
  while (days.includes(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
};

const STARTERS: string[] = [
  "What made you smile today? 😊",
  "If we could teleport anywhere right now, where to? ✈️",
  "Quick poll: coffee or tea? ☕",
  "Send a song that matches your mood 🎵",
  "What's one win you had this week? 🎉",
];

/* ---------- Living Orb (exported for bottom nav) ---------- */
export function LivingOrb({ active, unread = 0 }: { active?: boolean; unread?: number }) {
  const p = Math.min(unread, 8) / 8;
  return (
    <span className="orb-wrap" style={active ? { filter: "brightness(1.3)" } : undefined}>
      <span className="orb-ring r1" />
      <span className="orb-ring r2" />
      <span className="orb-core" />
      <span className="orb-badge" style={{ "--p": `${p * 100}%` } as React.CSSProperties} />
    </span>
  );
}

export function ChatsListView({ setView, chats, onOpenChat }: Props) {
  const supabase = createClient();
  const [me, setMe] = useState<string>("");
  const [enriched, setEnriched] = useState<Enriched[]>([]);
  const [hubOpen, setHubOpen] = useState<boolean>(false);
  const [term, setTerm] = useState<string>("");
  const [results, setResults] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [radar, setRadar] = useState<any[]>([]);
  const [summaryId, setSummaryId] = useState<string | null>(null);
  const [actionsId, setActionsId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const touch = useRef<{ x: number; id: string } | null>(null);

  const say = (m: string): void => { setToast(m); setTimeout(() => setToast(null), 2200); };

  /* session */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => data.user && setMe(data.user.id));
  }, [supabase]);

  /* enrich chats with real message data */
  useEffect(() => {
    if (!me) return;
    if (!chats.length) { setEnriched([]); return; }
    (async () => {
      const ids = chats.map((c: Chat) => c.id);
      const { data } = await supabase.from("messages")
        .select("chat_id,user_id,text,created_at").in("chat_id", ids).order("created_at", { ascending: true });
      const by: Record<string, any[]> = {};
      (data || []).forEach((m: any) => { (by[m.chat_id] = by[m.chat_id] || []).push(m); });
      const pinned: string[] = readLS("gc_pinned", []);
      const muted: string[] = readLS("gc_muted", []);
      const archived: string[] = readLS("gc_archived", []);
      const now = Date.now();
      const list: Enriched[] = chats.map((c: Chat) => {
        const msgs = by[c.id] || [];
        const last = msgs[msgs.length - 1];
        const lastRead = Number(localStorage.getItem(`gc_lastread_${c.id}`) || 0);
        const unread = msgs.filter((m: any) => m.user_id !== me && new Date(m.created_at).getTime() > lastRead).length;
        const age = last ? now - new Date(last.created_at).getTime() : Infinity;
        const score = msgs.length + (age < 864e5 ? 50 : age < 6048e5 ? 20 : 0) + (pinned.includes(c.id) ? 100 : 0);
        return {
          ...c, lastText: last?.text, lastAt: last?.created_at, lastMine: last?.user_id === me,
          count: msgs.length, unread, pinned: pinned.includes(c.id), muted: muted.includes(c.id),
          archived: archived.includes(c.id), score, mood: moodOf(last?.text), streak: streakOf(msgs),
          online: age < 300000, lastFew: msgs.slice(-5).map((m: any) => m.text).filter(Boolean),
        };
      }).sort((a: Enriched, b: Enriched) => b.score - a.score);
      setEnriched(list);
    })();
  }, [chats, me, supabase]);

  /* suggestions + radar (real profiles) */
  useEffect(() => {
    if (!me) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("id, username, display_name, avatar_url").neq("id", me).limit(12);
      const all = data || [];
      setSuggestions(all.slice(0, 8).map((p: any) => ({ ...p, compat: 70 + (hash(p.id) % 30) })));
      setRadar(all.slice(0, 9));
    })();
  }, [me, supabase]);

  /* smart search (name / username / email) */
  useEffect(() => {
    const t = setTimeout(async () => {
      const q = term.trim();
      if (q.length < 2) { setResults([]); return; }
      const { data } = await supabase.from("profiles")
        .select("id, username, display_name, email, avatar_url")
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%,email.ilike.%${q}%`)
        .neq("id", me).limit(8);
      setResults(data || []);
    }, 400);
    return () => clearTimeout(t);
  }, [term, me, supabase]);

  const startChatWith = async (person: any): Promise<void> => {
    const { data: chat, error } = await supabase.from("chats")
      .insert({ name: `Chat with ${person.display_name || person.username}`, created_by: me }).select().single();
    if (error || !chat) { say("Could not create chat"); return; }
    await supabase.from("chat_members").insert([
      { chat_id: chat.id, user_id: me, role: "owner" },
      { chat_id: chat.id, user_id: person.id, role: "member" },
    ]);
    setHubOpen(false);
    onOpenChat({ id: chat.id, name: chat.name, updated_at: chat.created_at });
  };

  const markRead = (id: string): void => {
    localStorage.setItem(`gc_lastread_${id}`, String(Date.now()));
    setEnriched((list: Enriched[]) => list.map((c: Enriched) => c.id === id ? { ...c, unread: 0 } : c));
    say("Marked as read ✓");
  };

  // ============================================================
  // FIXED: toggleLS with proper TypeScript types
  // ============================================================
  const toggleLS = (key: string, id: string, field: "pinned" | "muted" | "archived"): void => {
    const arr: string[] = readLS(key, []);
    const on: boolean = arr.includes(id);
    writeLS(key, on ? arr.filter((x: string) => x !== id) : [...arr, id]);
    setEnriched((list: Enriched[]) => list.map((c: Enriched) => 
      c.id === id ? { ...c, [field]: !on } : c
    ));
  };

  const visible: Enriched[] = enriched.filter((c: Enriched) => !c.archived);

  return (
    <div className="relative z-10 flex flex-col min-h-screen">
      {/* Header with Spark button */}
      <header className="sticky top-0 z-20 bg-[#0A1A0A]/85 backdrop-blur-xl border-b border-[rgba(255,215,0,0.15)] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("home")} className="p-2 rounded-full hover:bg-white/5"><ArrowLeft className="h-5 w-5 text-[#FFF5E6]" /></button>
          <h1 className="text-xl font-bold hub-title">Chats</h1>
        </div>
        <button className="spark-btn" aria-label="Open Connection Hub" onClick={() => setHubOpen(true)}>
          <span className="spark-diamond" />
          <span className="spark-orbit o1" /><span className="spark-orbit o2" /><span className="spark-orbit o3" />
        </button>
      </header>

      {/* Living conversation list */}
      <div className="hub-list">
        {visible.length === 0 && (
          <div className="text-center py-20 text-[rgba(255,245,230,0.5)]">
            <p className="mb-2">Your conversations start here.</p>
            <p className="text-xs">Tap the ✦ Spark to discover people.</p>
          </div>
        )}
        {visible.map((c: Enriched, i: number) => (
          <div key={c.id} style={{ animationDelay: `${i * 0.06}s` }}>
            <div
              className={`liv-row ${c.pinned ? "pinned" : ""}`}
              onClick={() => { localStorage.setItem(`gc_lastread_${c.id}`, String(Date.now())); onOpenChat(c); }}
              onDoubleClick={() => markRead(c.id)}
              onTouchStart={(e: React.TouchEvent) => (touch.current = { x: e.touches[0].clientX, id: c.id })}
              onTouchEnd={(e: React.TouchEvent) => {
                const t = touch.current; if (!t || t.id !== c.id) return;
                const dx = e.changedTouches[0].clientX - t.x;
                if (dx > 70) { setSummaryId(summaryId === c.id ? null : c.id); setActionsId(null); }
                else if (dx < -70) { setActionsId(actionsId === c.id ? null : c.id); setSummaryId(null); }
                touch.current = null;
              }}
            >
              <div className="liv-ava">
                <span className="ring" style={{
                  "--p": `${Math.min(c.unread, 10) * 10}%`,
                  "--rc": c.online ? "#22c55e" : (c.lastAt && Date.now() - new Date(c.lastAt).getTime() < 36e5 ? "#00F0FF" : "#B026FF"),
                } as React.CSSProperties} />
                <span className="face">{c.name.charAt(0).toUpperCase()}</span>
                {c.online && <span className="online-dot" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="liv-name truncate">{c.name}</span>
                  <span>{c.mood}</span>
                  {c.streak >= 7 && <span className="streak">🔥{c.streak}</span>}
                  {c.pinned && <Pin className="h-3 w-3 text-[#FFD700]" />}
                </div>
                <p className="liv-prev truncate">{c.lastMine ? "You: " : ""}{c.lastText || "Say hello 👋"}</p>
              </div>
              <div className="text-right">
                {c.lastAt && <p className="text-[10px] text-[rgba(255,245,230,0.4)]">{new Date(c.lastAt).getHours()}:{String(new Date(c.lastAt).getMinutes()).padStart(2, "0")}</p>}
                {c.unread > 0 && <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFD700] text-black">{c.unread}</span>}
              </div>
            </div>

            {/* Swipe right → AI summary */}
            {summaryId === c.id && (
              <div className="liv-panel">
                <Sparkles className="inline h-3.5 w-3.5 text-[#00F0FF] mr-1" />
                AI Summary: {c.count} messages exchanged. Current vibe {c.mood}. Recent: “{(c.lastFew.slice(-2).join(" · ") || "new conversation").slice(0, 80)}”
              </div>
            )}

            {/* Swipe left → actions */}
            {actionsId === c.id && (
              <div className="liv-actions">
                <button onClick={() => toggleLS("gc_pinned", c.id, "pinned")}><Pin className="h-4 w-4 text-[#FFD700]" />{c.pinned ? "Unpin" : "Pin"}</button>
                <button onClick={() => toggleLS("gc_muted", c.id, "muted")}><BellOff className="h-4 w-4" />{c.muted ? "Unmute" : "Mute"}</button>
                <button onClick={() => { toggleLS("gc_archived", c.id, "archived"); say("Archived"); }}><Archive className="h-4 w-4" />Archive</button>
                <button onClick={() => markRead(c.id)}><Zap className="h-4 w-4 text-[#00F0FF]" />Read</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ============ CONNECTION HUB ============ */}
      {hubOpen && (
        <div className="hub-overlay">
          <header className="sticky top-0 z-10 bg-[#0A1A0A]/90 backdrop-blur-xl px-4 py-3 flex items-center justify-between border-b border-[rgba(255,215,0,0.15)]">
            <h2 className="hub-title text-lg">✦ Connection Hub</h2>
            <button onClick={() => setHubOpen(false)} className="p-2 rounded-full hover:bg-white/10"><X className="h-5 w-5 text-[#FFF5E6]" /></button>
          </header>

          <div className="hub-scroll">
            {/* Zone A — Presence Radar */}
            <section className="hub-zone">
              <h3 className="hub-title text-sm mb-1">Who's Around? <span className="hub-gold">· Presence Radar</span></h3>
              <div className="radar">
                <span className="radar-sweep" />
                {radar.map((p: any) => {
                  const h = hash(p.id);
                  return (
                    <button key={p.id} className="radar-dot" style={{ left: `${15 + (h % 70)}%`, top: `${12 + ((h >> 2) % 68)}%`, animationDelay: `${(h % 10) / 5}s` }} onClick={() => startChatWith(p)}>
                      <small>{(p.display_name || p.username || "?").slice(0, 8)}</small>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Zone B — Smart Search */}
            <section className="hub-zone">
              <h3 className="hub-title text-sm mb-2">Smart Search</h3>
              <div className="flex gap-2">
                <input value={term} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTerm(e.target.value)} placeholder="Name, @username, or email..."
                  className="flex-1 rounded-xl bg-white/5 border border-[rgba(255,215,0,0.2)] px-4 py-3 text-[#FFF5E6] outline-none" />
                <button className="p-3 rounded-xl bg-[rgba(255,215,0,0.15)] text-[#FFD700]"><Search className="h-5 w-5" /></button>
              </div>
              <div className="flex gap-2 mt-2">
                {[Mic, ImageIcon, QrCode, Link2].map((Ic: any, i: number) => (
                  <button key={i} onClick={() => say("Coming soon ✨")} className="p-2.5 rounded-lg bg-white/5 text-[rgba(255,245,230,0.6)]"><Ic className="h-4 w-4" /></button>
                ))}
              </div>
              {results.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 mt-3 p-2 rounded-xl bg-white/5">
                  <span className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center font-bold text-white">
                    {(p.display_name || p.username || "U").charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#FFF5E6] truncate">{p.display_name}</p>
                    <p className="text-[10px] text-[rgba(255,245,230,0.5)] truncate">@{p.username} · {p.email}</p>
                  </div>
                  <button onClick={() => startChatWith(p)} className="px-3 py-1.5 rounded-lg bg-[#FFD700] text-black text-xs font-bold">Chat</button>
                </div>
              ))}
            </section>

            {/* Zone C — Suggested Connections */}
            <section className="hub-zone">
              <h3 className="hub-title text-sm mb-2">Suggested For You <span className="hub-gold">· AI-curated</span></h3>
              <div className="sugg-row">
                {suggestions.map((p: any) => (
                  <div key={p.id} className="sugg-card">
                    <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center font-bold text-white">
                      {(p.display_name || p.username || "U").charAt(0).toUpperCase()}
                    </div>
                    <p className="text-xs text-[#FFF5E6] mt-2 truncate">{p.display_name || p.username}</p>
                    <p className="compat">⚡ {p.compat}% compatible</p>
                    <button onClick={() => startChatWith(p)} className="mt-2 px-3 py-1 rounded-lg bg-white/10 text-[10px] text-[#FFF5E6]">Connect</button>
                  </div>
                ))}
              </div>
            </section>

            {/* Zone D — Quick Actions */}
            <section className="hub-zone">
              <h3 className="hub-title text-sm mb-2">Quick Actions</h3>
              <div className="qa-grid">
                <button className="qa-btn" onClick={() => { setHubOpen(false); setView("gtribe"); }}><Users2 className="h-5 w-5 text-[#00F0FF]" />New Group</button>
                <button className="qa-btn" onClick={() => say("Broadcast coming soon 📡")}><Megaphone className="h-5 w-5 text-[#FFD700]" />Broadcast</button>
                <button className="qa-btn" onClick={() => say("Anonymous Chat coming soon 🎭")}><Ghost className="h-5 w-5 text-[#B026FF]" />Anonymous</button>
                <button className="qa-btn" onClick={() => { setHubOpen(false); setView("gchatone"); }}><Building2 className="h-5 w-5 text-[#22c55e]" />Business</button>
                <button className="qa-btn" onClick={() => say("Support is on its way 🤍")}><LifeBuoy className="h-5 w-5 text-[#FF2D95]" />Support</button>
              </div>
            </section>

            {/* Zone E — Conversation Starters */}
            <section className="hub-zone">
              <h3 className="hub-title text-sm mb-2">Conversation Starters <span className="hub-gold">· AI icebreakers</span></h3>
              {STARTERS.map((s: string) => (
                <button key={s} className="starter-chip" onClick={async () => {
                  try { await navigator.clipboard.writeText(s); say("Starter copied — paste it in any chat ✨"); }
                  catch { say(s); }
                }}>{s}</button>
              ))}
            </section>
          </div>
        </div>
      )}
      {toast && <div className="hub-toast">{toast}</div>}
    </div>
  );
}