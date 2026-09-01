"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ArrowLeft, Search, Mic, Image as ImageIcon, QrCode, Link2, Users2, Megaphone,
  Ghost, Building2, LifeBuoy, Sparkles, X, Pin, BellOff, Archive, Trash2, Flame, Zap,
  Volume2, VolumeX, Send, Smile, Clock, Star, Heart, ThumbsUp, PartyPopper
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import "./chat-hub.css";

// ============================================================
// TYPES
// ============================================================
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

// ============================================================
// HELPERS
// ============================================================
const readLS = (k: string, fb: string[]) => {
  try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return fb; }
};
const writeLS = (k: string, v: string[]) => localStorage.setItem(k, JSON.stringify(v));
const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997; return h; };

const moodOf = (text?: string) => {
  if (!text) return "💬";
  const t = text.toLowerCase();
  if (/\$|pay|money|bank|earn|sent/.test(t)) return "💰";
  if (/(love|happy|great|good|thanks|yes|nice|🎉)/.test(t)) return "😊";
  if (/(where|location|meet|address|map)/.test(t)) return "📍";
  if (/(sad|sorry|bad|angry)/.test(t)) return "🌧️";
  return "💬";
};

const streakOf = (msgs: any[]) => {
  const days = [...new Set(msgs.map(m => new Date(m.created_at).toDateString()))];
  let streak = 0; const d = new Date();
  if (!days.includes(d.toDateString())) d.setDate(d.getDate() - 1);
  while (days.includes(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
};

const STARTERS = [
  "What made you smile today? 😊",
  "If we could teleport anywhere right now, where to? ✈️",
  "Quick poll: coffee or tea? ☕",
  "Send a song that matches your mood 🎵",
  "What's one win you had this week? 🎉",
];

const REACTIONS = ["✨", "🌟", "💎", "❤️", "🔥", "🎉"];

// ============================================================
// ATMOSPHERE ENGINE (Canvas-based)
// ============================================================
class AtmosphereEngine {
  private rainCanvas: HTMLCanvasElement | null = null;
  private waterCanvas: HTMLCanvasElement | null = null;
  private particleCanvas: HTMLCanvasElement | null = null;
  private rainCtx: CanvasRenderingContext2D | null = null;
  private waterCtx: CanvasRenderingContext2D | null = null;
  private particleCtx: CanvasRenderingContext2D | null = null;
  private rainDrops: any[] = [];
  private particles: any[] = [];
  private waterRipples: any[] = [];
  private waterTime = 0;
  private running = true;
  private animationId: number | null = null;

  constructor() {
    this.init();
  }

  private init() {
    this.rainCanvas = document.getElementById('rainCanvas') as HTMLCanvasElement;
    this.waterCanvas = document.getElementById('waterCanvas') as HTMLCanvasElement;
    this.particleCanvas = document.getElementById('particleCanvas') as HTMLCanvasElement;

    if (this.rainCanvas) {
      this.rainCtx = this.rainCanvas.getContext('2d');
      this.resizeRain();
    }
    if (this.waterCanvas) {
      this.waterCtx = this.waterCanvas.getContext('2d');
      this.resizeWater();
    }
    if (this.particleCanvas) {
      this.particleCtx = this.particleCanvas.getContext('2d');
      this.resizeParticles();
    }

    this.createRain();
    this.createParticles();
    window.addEventListener('resize', () => this.resize());
    this.animate();
  }

  private resizeRain() {
    if (!this.rainCanvas) return;
    this.rainCanvas.width = window.innerWidth;
    this.rainCanvas.height = window.innerHeight;
  }

  private resizeWater() {
    if (!this.waterCanvas) return;
    this.waterCanvas.width = window.innerWidth;
    this.waterCanvas.height = 60;
  }

  private resizeParticles() {
    if (!this.particleCanvas) return;
    this.particleCanvas.width = window.innerWidth;
    this.particleCanvas.height = window.innerHeight;
  }

  private resize() {
    this.resizeRain();
    this.resizeWater();
    this.resizeParticles();
    this.createRain();
    this.createParticles();
  }

  private createRain() {
    if (!this.rainCanvas) return;
    const count = Math.min(150, Math.floor(window.innerWidth / 5));
    this.rainDrops = [];
    for (let i = 0; i < count; i++) {
      this.rainDrops.push({
        x: Math.random() * this.rainCanvas.width,
        y: Math.random() * this.rainCanvas.height,
        length: 8 + Math.random() * 18,
        speed: 1.5 + Math.random() * 2.5,
        opacity: 0.1 + Math.random() * 0.25,
        width: 0.5 + Math.random() * 0.8
      });
    }
  }

  private createParticles() {
    if (!this.particleCanvas) return;
    const count = 30;
    this.particles = [];
    const colors = [
      'rgba(255, 215, 0, ',
      'rgba(0, 240, 255, ',
      'rgba(255, 245, 230, '
    ];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.particleCanvas.width,
        y: Math.random() * this.particleCanvas.height,
        size: 1.5 + Math.random() * 3.5,
        speedX: (Math.random() - 0.5) * 0.25,
        speedY: -0.15 - Math.random() * 0.35,
        opacity: 0.2 + Math.random() * 0.35,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.005 + Math.random() * 0.008,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  private drawRain() {
    const ctx = this.rainCtx;
    if (!ctx || !this.rainCanvas) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    this.rainDrops.forEach(d => {
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + 6, d.y + d.length);
      ctx.strokeStyle = `rgba(200, 230, 255, ${d.opacity})`;
      ctx.lineWidth = d.width;
      ctx.lineCap = 'round';
      ctx.stroke();

      d.y += d.speed;
      d.x += 1.2;

      if (d.y > ctx.canvas.height) {
        d.y = -d.length;
        d.x = Math.random() * ctx.canvas.width;
      }
      if (d.x > ctx.canvas.width) {
        d.x = -10;
        d.y = Math.random() * ctx.canvas.height;
      }
    });
  }

  private drawWater() {
    const ctx = this.waterCtx;
    if (!ctx || !this.waterCanvas) return;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    ctx.clearRect(0, 0, w, h);

    this.waterTime += 0.025;

    // Primary wave
    ctx.beginPath();
    for (let x = 0; x < w; x += 2) {
      const y = h / 2 +
        Math.sin(x * 0.02 + this.waterTime) * 5 +
        Math.sin(x * 0.035 + this.waterTime * 0.7) * 3 +
        Math.sin(x * 0.01 + this.waterTime * 1.3) * 7;

      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Secondary wave
    ctx.beginPath();
    for (let x = 0; x < w; x += 2) {
      const y = h / 2 + 6 +
        Math.sin(x * 0.025 + this.waterTime * 0.8 + 2) * 4 +
        Math.sin(x * 0.04 + this.waterTime * 0.5) * 2.5;

      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.06)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Ripples
    this.waterRipples = this.waterRipples.filter(r => r.life > 0);
    this.waterRipples.forEach(r => {
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(200, 230, 255, ${r.life * 0.25})`;
      ctx.lineWidth = 1.5 - r.life * 0.5;
      ctx.stroke();
      r.radius += 0.4;
      r.life -= 0.008;
    });
  }

  private drawParticles() {
    const ctx = this.particleCtx;
    if (!ctx || !this.particleCanvas) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    this.particles.forEach(p => {
      p.pulse += p.pulseSpeed;
      const opacity = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse));

      // Glow
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5);
      grad.addColorStop(0, p.color + (opacity * 0.3) + ')');
      grad.addColorStop(1, p.color + '0)');
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.7 + 0.3 * Math.sin(p.pulse * 0.5)), 0, Math.PI * 2);
      ctx.fillStyle = p.color + opacity + ')';
      ctx.fill();

      p.x += p.speedX + Math.sin(p.pulse * 0.3) * 0.08;
      p.y += p.speedY;

      if (p.y < -10) { p.y = ctx.canvas.height + 10; p.x = Math.random() * ctx.canvas.width; }
      if (p.x < -10) p.x = ctx.canvas.width + 10;
      if (p.x > ctx.canvas.width + 10) p.x = -10;
    });
  }

  private animate = () => {
    if (!this.running) return;
    this.drawRain();
    this.drawWater();
    this.drawParticles();
    this.animationId = requestAnimationFrame(this.animate);
  };

  public addRipple(x: number, y: number) {
    this.waterRipples.push({ x, y, radius: 2, life: 1 });
  }

  public destroy() {
    this.running = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

// ============================================================
// LIVING ORB COMPONENT
// ============================================================
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

// ============================================================
// SMART COMPOSE SUGGESTIONS
// ============================================================
function SmartCompose({ onSelect }: { onSelect: (text: string) => void }) {
  const suggestions = [
    "Sounds great! 😊",
    "Let me check on that...",
    "I'll get back to you soon",
    "Can you elaborate?",
    "Thanks for sharing!",
  ];
  return (
    <div className="smart-compose">
      {suggestions.map(s => (
        <button key={s} onClick={() => onSelect(s)}>{s}</button>
      ))}
    </div>
  );
}

// ============================================================
// MESSAGE EFFECTS
// ============================================================
function MessageEffect({ type, onComplete }: { type: string; onComplete: () => void }) {
  const icons: Record<string, string> = {
    'confetti': '🎉',
    'sparkles': '✨',
    'rain': '🌧️',
    'heart': '❤️',
  };
  return (
    <div className="message-effect" onAnimationEnd={onComplete}>
      {icons[type] || '✨'}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export function ChatsListView({ setView, chats, onOpenChat }: Props) {
  const supabase = createClient();
  const [me, setMe] = useState<string>("");
  const [enriched, setEnriched] = useState<Enriched[]>([]);
  const [hubOpen, setHubOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [radar, setRadar] = useState<any[]>([]);
  const [summaryId, setSummaryId] = useState<string | null>(null);
  const [actionsId, setActionsId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [effect, setEffect] = useState<string | null>(null);
  const touch = useRef<{ x: number; id: string } | null>(null);
  const atmosphereRef = useRef<AtmosphereEngine | null>(null);

  const say = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2200); };

  // ============================================================
  // INIT ATMOSPHERE
  // ============================================================
  useEffect(() => {
    // Wait for DOM to render
    const timer = setTimeout(() => {
      if (!atmosphereRef.current) {
        atmosphereRef.current = new AtmosphereEngine();
      }
    }, 100);
    return () => {
      clearTimeout(timer);
      if (atmosphereRef.current) {
        atmosphereRef.current.destroy();
        atmosphereRef.current = null;
      }
    };
  }, []);

  // ============================================================
  // SESSION
  // ============================================================
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => data.user && setMe(data.user.id));
  }, []);

  // ============================================================
  // ENRICH CHATS
  // ============================================================
  useEffect(() => {
    if (!me) return;
    if (!chats.length) { setEnriched([]); return; }
    (async () => {
      const ids = chats.map(c => c.id);
      const { data } = await supabase.from("messages")
        .select("chat_id,user_id,text,created_at")
        .in("chat_id", ids)
        .order("created_at", { ascending: true });

      const by: Record<string, any[]> = {};
      (data || []).forEach(m => { (by[m.chat_id] = by[m.chat_id] || []).push(m); });

      const pinned = readLS("gc_pinned", []);
      const muted = readLS("gc_muted", []);
      const archived = readLS("gc_archived", []);
      const now = Date.now();

      const list: Enriched[] = chats.map(c => {
        const msgs = by[c.id] || [];
        const last = msgs[msgs.length - 1];
        const lastRead = Number(localStorage.getItem(`gc_lastread_${c.id}`) || 0);
        const unread = msgs.filter(m => m.user_id !== me && new Date(m.created_at).getTime() > lastRead).length;
        const age = last ? now - new Date(last.created_at).getTime() : Infinity;
        const score = msgs.length + (age < 864e5 ? 50 : age < 6048e5 ? 20 : 0) + (pinned.includes(c.id) ? 100 : 0);

        return {
          ...c,
          lastText: last?.text,
          lastAt: last?.created_at,
          lastMine: last?.user_id === me,
          count: msgs.length,
          unread,
          pinned: pinned.includes(c.id),
          muted: muted.includes(c.id),
          archived: archived.includes(c.id),
          score,
          mood: moodOf(last?.text),
          streak: streakOf(msgs),
          online: age < 300000,
          lastFew: msgs.slice(-5).map(m => m.text).filter(Boolean),
        };
      }).sort((a, b) => b.score - a.score);

      setEnriched(list);
    })();
  }, [chats, me]);

  // ============================================================
  // SUGGESTIONS + RADAR
  // ============================================================
  useEffect(() => {
    if (!me) return;
    (async () => {
      const { data } = await supabase.from("profiles")
        .select("id, username, display_name, avatar_url")
        .neq("id", me)
        .limit(12);
      const all = data || [];
      setSuggestions(all.slice(0, 8).map(p => ({ ...p, compat: 70 + (hash(p.id) % 30) })));
      setRadar(all.slice(0, 9));
    })();
  }, [me]);

  // ============================================================
  // SMART SEARCH
  // ============================================================
  useEffect(() => {
    const t = setTimeout(async () => {
      const q = term.trim();
      if (q.length < 2) { setResults([]); return; }
      const { data } = await supabase.from("profiles")
        .select("id, username, display_name, email, avatar_url")
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%,email.ilike.%${q}%`)
        .neq("id", me)
        .limit(8);
      setResults(data || []);
    }, 400);
    return () => clearTimeout(t);
  }, [term, me]);

  // ============================================================
  // ACTIONS
  // ============================================================
  const startChatWith = async (person: any) => {
    const { data: chat, error } = await supabase.from("chats")
      .insert({ name: `Chat with ${person.display_name || person.username}`, created_by: me })
      .select()
      .single();

    if (error || !chat) { say("Could not create chat"); return; }

    await supabase.from("chat_members").insert([
      { chat_id: chat.id, user_id: me, role: "owner" },
      { chat_id: chat.id, user_id: person.id, role: "member" },
    ]);

    setHubOpen(false);
    onOpenChat({ id: chat.id, name: chat.name, updated_at: chat.created_at });
  };

  const markRead = (id: string) => {
    localStorage.setItem(`gc_lastread_${id}`, String(Date.now()));
    setEnriched(list => list.map(c => c.id === id ? { ...c, unread: 0 } : c));
    say("Marked as read ✓");
  };

  const toggleLS = (key: string, id: string, field: "pinned" | "muted" | "archived") => {
    const arr = readLS(key, []);
    const on = arr.includes(id);
    writeLS(key, on ? arr.filter(x => x !== id) : [...arr, id]);
    setEnriched(list => list.map(c => c.id === id ? { ...c, [field]: !on } : c));
  };

  const triggerEffect = (type: string) => {
    setEffect(type);
    setTimeout(() => setEffect(null), 1200);
  };

  const sendWithEffect = (text: string) => {
    const effects = ['confetti', 'sparkles', 'rain', 'heart'];
    triggerEffect(effects[Math.floor(Math.random() * effects.length)]);
    // In a real implementation, this would send the message
    say("✨ Message sent with " + effects[Math.floor(Math.random() * effects.length)]);
  };

  // ============================================================
  // RENDER
  // ============================================================
  const visible = enriched.filter(c => !c.archived);

  return (
    <div className="relative z-10 flex flex-col min-h-screen">
      {/* Sound Toggle */}
      <button
        className="sound-toggle"
        onClick={() => { setSoundOn(!soundOn); say(soundOn ? "🔇 Sound off" : "🔊 Sound on"); }}
        aria-label="Toggle ambient sound"
      >
        {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </button>

      {/* Message Effect */}
      {effect && <MessageEffect type={effect} onComplete={() => setEffect(null)} />}

      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#0A1A0A]/85 backdrop-blur-xl border-b border-[rgba(255,215,0,0.15)] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("home")} className="p-2 rounded-full hover:bg-white/5">
            <ArrowLeft className="h-5 w-5 text-[#FFF5E6]" />
          </button>
          <h1 className="text-xl font-bold hub-title">Chats</h1>
        </div>
        <button className="spark-btn" aria-label="Open Connection Hub" onClick={() => setHubOpen(true)}>
          <span className="spark-diamond" />
          <span className="spark-orbit o1" /><span className="spark-orbit o2" /><span className="spark-orbit o3" />
        </button>
      </header>

      {/* Chat List */}
      <div className="hub-list">
        {visible.length === 0 && (
          <div className="text-center py-20 text-[rgba(255,245,230,0.5)]">
            <p className="mb-2">Your conversations start here.</p>
            <p className="text-xs">Tap the ✦ Spark to discover people.</p>
          </div>
        )}

        {visible.map((c, i) => (
          <div key={c.id} style={{ animationDelay: `${i * 0.06}s` }}>
            <div
              className={`liv-row ${c.pinned ? "pinned" : ""}`}
              onClick={() => {
                localStorage.setItem(`gc_lastread_${c.id}`, String(Date.now()));
                onOpenChat(c);
              }}
              onDoubleClick={() => markRead(c.id)}
              onTouchStart={e => (touch.current = { x: e.touches[0].clientX, id: c.id })}
              onTouchEnd={e => {
                const t = touch.current;
                if (!t || t.id !== c.id) return;
                const dx = e.changedTouches[0].clientX - t.x;
                if (dx > 70) {
                  setSummaryId(summaryId === c.id ? null : c.id);
                  setActionsId(null);
                  if (atmosphereRef.current) {
                    atmosphereRef.current.addRipple(e.changedTouches[0].clientX, window.innerHeight - 30);
                  }
                } else if (dx < -70) {
                  setActionsId(actionsId === c.id ? null : c.id);
                  setSummaryId(null);
                }
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
                {c.lastAt && (
                  <p className="text-[10px] text-[rgba(255,245,230,0.4)]">
                    {new Date(c.lastAt).getHours()}:{String(new Date(c.lastAt).getMinutes()).padStart(2, "0")}
                  </p>
                )}
                {c.unread > 0 && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFD700] text-black">
                    {c.unread}
                  </span>
                )}
              </div>
            </div>

            {/* AI Summary */}
            {summaryId === c.id && (
              <div className="liv-panel open">
                <Sparkles className="inline h-3.5 w-3.5 text-[#00F0FF] mr-1" />
                AI Summary: {c.count} messages exchanged. Current vibe {c.mood}.
                Recent: “{(c.lastFew.slice(-2).join(" · ") || "new conversation").slice(0, 80)}”
                <div className="mt-2 flex gap-2">
                  <button className="text-[10px] px-2 py-0.5 rounded bg-[rgba(255,215,0,0.1)] text-[#FFD700]" onClick={() => triggerEffect('sparkles')}>
                    ✨ React
                  </button>
                  <button className="text-[10px] px-2 py-0.5 rounded bg-[rgba(0,240,255,0.1)] text-[#00F0FF]" onClick={() => say("💬 Smart reply coming...")}>
                    💡 Reply
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            {actionsId === c.id && (
              <div className="liv-actions open">
                <button onClick={() => toggleLS("gc_pinned", c.id, "pinned")}>
                  <Pin className="h-4 w-4 text-[#FFD700]" />
                  {c.pinned ? "Unpin" : "Pin"}
                </button>
                <button onClick={() => toggleLS("gc_muted", c.id, "muted")}>
                  <BellOff className="h-4 w-4" />
                  {c.muted ? "Unmute" : "Mute"}
                </button>
                <button onClick={() => { toggleLS("gc_archived", c.id, "archived"); say("📦 Archived"); }}>
                  <Archive className="h-4 w-4" />
                  Archive
                </button>
                <button onClick={() => markRead(c.id)}>
                  <Zap className="h-4 w-4 text-[#00F0FF]" />
                  Read
                </button>
                <button onClick={() => { triggerEffect('confetti'); say("🎉 Celebration sent!"); }}>
                  <PartyPopper className="h-4 w-4 text-[#FFD700]" />
                  Celebrate
                </button>
              </div>
            )}

            {/* Smart Compose (shown on hover in real implementation) */}
            <div className="mt-1" style={{ display: actionsId === c.id ? 'flex' : 'none' }}>
              <SmartCompose onSelect={(text) => { sendWithEffect(text); }} />
            </div>
          </div>
        ))}
      </div>

      {/* ============================================================
      CONNECTION HUB
      ============================================================ */}
      {hubOpen && (
        <div className="hub-overlay">
          <header className="sticky top-0 z-10 bg-[#0A1A0A]/90 backdrop-blur-xl px-4 py-3 flex items-center justify-between border-b border-[rgba(255,215,0,0.15)]">
            <h2 className="hub-title text-lg">✦ Connection Hub</h2>
            <button onClick={() => setHubOpen(false)} className="p-2 rounded-full hover:bg-white/10">
              <X className="h-5 w-5 text-[#FFF5E6]" />
            </button>
          </header>

          <div className="hub-scroll">
            {/* Zone A — Presence Radar */}
            <section className="hub-zone">
              <h3 className="hub-title text-sm mb-1">
                Who's Around? <span className="hub-gold">· Presence Radar</span>
              </h3>
              <div className="radar">
                <span className="radar-sweep" />
                {radar.map(p => {
                  const h = hash(p.id);
                  return (
                    <button
                      key={p.id}
                      className="radar-dot"
                      style={{
                        left: `${15 + (h % 70)}%`,
                        top: `${12 + ((h >> 2) % 68)}%`,
                        animationDelay: `${(h % 10) / 5}s`
                      }}
                      onClick={() => startChatWith(p)}
                    >
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
                <input
                  value={term}
                  onChange={e => setTerm(e.target.value)}
                  placeholder="Name, @username, or email..."
                  className="flex-1 rounded-xl bg-white/5 border border-[rgba(255,215,0,0.2)] px-4 py-3 text-[#FFF5E6] outline-none"
                />
                <button className="p-3 rounded-xl bg-[rgba(255,215,0,0.15)] text-[#FFD700]">
                  <Search className="h-5 w-5" />
                </button>
              </div>
              <div className="flex gap-2 mt-2">
                {[Mic, ImageIcon, QrCode, Link2].map((Ic, i) => (
                  <button
                    key={i}
                    onClick={() => say(`🔮 ${['Voice search', 'Image search', 'QR scan', 'Link share'][i]} coming soon`)}
                    className="p-2.5 rounded-lg bg-white/5 text-[rgba(255,245,230,0.6)]"
                  >
                    <Ic className="h-4 w-4" />
                  </button>
                ))}
              </div>

              {results.map(p => (
                <div key={p.id} className="flex items-center gap-3 mt-3 p-2 rounded-xl bg-white/5">
                  <span className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center font-bold text-white">
                    {(p.display_name || p.username || "U").charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#FFF5E6] truncate">{p.display_name}</p>
                    <p className="text-[10px] text-[rgba(255,245,230,0.5)] truncate">
                      @{p.username} · {p.email}
                    </p>
                  </div>
                  <button onClick={() => startChatWith(p)} className="px-3 py-1.5 rounded-lg bg-[#FFD700] text-black text-xs font-bold">
                    Chat
                  </button>
                </div>
              ))}
            </section>

            {/* Zone C — Suggested Connections */}
            <section className="hub-zone">
              <h3 className="hub-title text-sm mb-2">
                Suggested For You <span className="hub-gold">· AI-curated</span>
              </h3>
              <div className="sugg-row">
                {suggestions.map(p => (
                  <div key={p.id} className="sugg-card">
                    <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center font-bold text-white">
                      {(p.display_name || p.username || "U").charAt(0).toUpperCase()}
                    </div>
                    <p className="text-xs text-[#FFF5E6] mt-2 truncate">{p.display_name || p.username}</p>
                    <p className="compat">⚡ {p.compat}% compatible</p>
                    <button onClick={() => startChatWith(p)} className="mt-2 px-3 py-1 rounded-lg bg-white/10 text-[10px] text-[#FFF5E6]">
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Zone D — Quick Actions */}
            <section className="hub-zone">
              <h3 className="hub-title text-sm mb-2">Quick Actions</h3>
              <div className="qa-grid">
                <button className="qa-btn" onClick={() => { setHubOpen(false); setView("gtribe"); }}>
                  <Users2 className="h-5 w-5 text-[#00F0FF]" />New Group
                </button>
                <button className="qa-btn" onClick={() => say("📡 Broadcast coming soon")}>
                  <Megaphone className="h-5 w-5 text-[#FFD700]" />Broadcast
                </button>
                <button className="qa-btn" onClick={() => say("🎭 Anonymous Chat coming soon")}>
                  <Ghost className="h-5 w-5 text-[#B026FF]" />Anonymous
                </button>
                <button className="qa-btn" onClick={() => { setHubOpen(false); setView("gchatone"); }}>
                  <Building2 className="h-5 w-5 text-[#22c55e]" />Business
                </button>
                <button className="qa-btn" onClick={() => say("🤍 Support on its way")}>
                  <LifeBuoy className="h-5 w-5 text-[#FF2D95]" />Support
                </button>
              </div>
            </section>

            {/* Zone E — Conversation Starters */}
            <section className="hub-zone">
              <h3 className="hub-title text-sm mb-2">
                Conversation Starters <span className="hub-gold">· AI icebreakers</span>
              </h3>
              {STARTERS.map(s => (
                <button
                  key={s}
                  className="starter-chip"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(s);
                      say("📋 Starter copied — paste it in any chat");
                    } catch {
                      say(s);
                    }
                  }}
                >
                  {s}
                </button>
              ))}
            </section>

            {/* Reactions Preview */}
            <section className="hub-zone">
              <h3 className="hub-title text-sm mb-2">
                Custom Reactions <span className="hub-gold">· G-Chat exclusive</span>
              </h3>
              <div className="reaction-bar">
                {REACTIONS.map(r => (
                  <button
                    key={r}
                    className="reaction-btn"
                    onClick={() => { say(`👍 Reacted with ${r}`); triggerEffect('sparkles'); }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {toast && <div className="hub-toast show">{toast}</div>}
    </div>
  );
}