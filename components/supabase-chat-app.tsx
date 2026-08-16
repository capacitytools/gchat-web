"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import {
  ArrowLeft,
  Copy,
  LogOut,
  MessageCircle,
  Newspaper,
  Phone,
  Plus,
  Send,
  Wallet,
} from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { GButton } from "@/components/gbutton";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { ChatRow, MessageRow } from "@/lib/types";

type Tab = "chats" | "feed" | "calls" | "wallet";

export function SupabaseChatApp() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>("chats");
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [loadingChats, setLoadingChats] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const [copied, setCopied] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {    const client = supabase;

    if (!client) {
      return;
    }

    client.auth
      .getSession()
      .then(({ data }) => setUser(data.session?.user ?? null));

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const ensureProfile = useCallback(async () => {
    const client = supabase;

    if (!client || !user) {
      return;
    }

    const fallbackName = user.email
      ? user.email.split("@")[0]
      : "G-User";

    await client.from("profiles").upsert(
      {
        id: user.id,
        display_name: fallbackName,
      },
      {
        onConflict: "id",
        ignoreDuplicates: true,
      }
    );
  }, [user]);

  useEffect(() => {
    setActiveChatId(null);
    setMessages([]);
  }, [user?.id]);

  useEffect(() => {
    void ensureProfile();
  }, [ensureProfile]);
  const activeChat = useMemo(() => {
    return chats.find((chat) => chat.id === activeChatId) ?? null;
  }, [chats, activeChatId]);

  const addMessage = useCallback((message: MessageRow) => {
    setMessages((previousMessages) => {
      const exists = previousMessages.some((item) => item.id === message.id);

      if (exists) {
        return previousMessages;
      }

      return [...previousMessages, message];
    });
  }, []);

  const fetchChats = useCallback(async () => {
    const client = supabase;

    if (!client || !user) {
      return;
    }

    setLoadingChats(true);
    setError("");

    const { data, error: fetchError } = await client
      .from("chat_members")
      .select("chat_id, chats(id, name, created_at, created_by)")
      .eq("user_id", user.id)
      .order("joined_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      const rows = (data ?? []) as Array<{
        chats: ChatRow | ChatRow[] | null;
      }>;

      const mapped = rows
        .map((row) => (Array.isArray(row.chats) ? row.chats[0] : row.chats))
        .filter(Boolean) as ChatRow[];

      setChats(mapped);
    }

    setLoadingChats(false);
  }, [user]);
  useEffect(() => {
    if (user) {
      void fetchChats();
    } else {
      setChats([]);
    }
  }, [user, fetchChats]);

  useEffect(() => {
    const client = supabase;

    if (!client || !activeChatId) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    async function loadMessages() {
      if (!client || !activeChatId) {
        return;
      }

      const { data, error: messagesError } = await client
        .from("messages")
        .select(
          "id, chat_id, user_id, text, created_at, profiles(id, username, display_name)"
        )
        .eq("chat_id", activeChatId)
        .order("created_at", { ascending: true });

      if (!cancelled) {
        if (messagesError) {
          setError(messagesError.message);
        } else {
          setMessages((data ?? []) as MessageRow[]);
        }
      }
    }

    void loadMessages();

    const channel = client
      .channel(`messages:${activeChatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",          filter: `chat_id=eq.${activeChatId}`,
        },
        (payload) => {
          addMessage(payload.new as MessageRow);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void client.removeChannel(channel);
    };
  }, [activeChatId, addMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, activeChatId]);

  async function createChat() {
    const client = supabase;

    if (!client || !user) {
      return;
    }

    await ensureProfile();

    setCreatingChat(true);
    setError("");

    const { data: chat, error: chatError } = await client
      .from("chats")
      .insert({
        name: "New conversation",
        created_by: user.id,
      })
      .select()
      .single();

    if (chatError || !chat) {
      setError(chatError?.message ?? "Could not create chat.");
      setCreatingChat(false);
      return;
    }

    const { error: memberError } = await client.from("chat_members").insert({
      chat_id: chat.id,
      user_id: user.id,
      role: "owner",
    });
    if (memberError) {
      setError(memberError.message);
    } else {
      const newChat = chat as ChatRow;

      setChats((previousChats) => [newChat, ...previousChats]);
      setActiveChatId(newChat.id);
      setTab("chats");
    }

    setCreatingChat(false);
  }

  async function joinChat() {
    const client = supabase;

    if (!client || !user) {
      return;
    }

    const chatId = joinCode.trim();

    if (!chatId) {
      return;
    }

    await ensureProfile();

    setError("");

    const { error: joinError } = await client.from("chat_members").insert({
      chat_id: chatId,
      user_id: user.id,
      role: "member",
    });

    if (joinError) {
      setError(joinError.message);
    } else {
      setJoinCode("");
      await fetchChats();
    }
  }

  async function sendMessage() {
    const client = supabase;

    if (!client || !user || !activeChat) {
      return;    }

    const text = draft.trim();

    if (!text) {
      return;
    }

    setDraft("");

    const { data, error: sendError } = await client
      .from("messages")
      .insert({
        chat_id: activeChat.id,
        user_id: user.id,
        text,
      })
      .select()
      .single();

    if (sendError) {
      setError(sendError.message);
    } else if (data) {
      addMessage(data as MessageRow);
    }
  }

  async function signOut() {
    const client = supabase;

    if (!client) {
      return;
    }

    await client.auth.signOut();
  }

  async function copyInviteId() {
    if (!activeChat) {
      return;
    }

    try {
      await navigator.clipboard.writeText(activeChat.id);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {      setError("Clipboard copy failed.");
    }
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gbackground dark:bg-gdark-background">
        <div className="text-gmuted dark:text-gdark-muted">
          Loading G-Chat...
        </div>
      </div>
    );
  }

  if (!isSupabaseConfigured || !supabase) {
    return <SetupScreen />;
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-gbackground dark:bg-gdark-background">
        <header className="sticky top-0 z-20 border-b border-gborder bg-white/95 px-4 py-3 backdrop-blur dark:border-gdark-border dark:bg-gdark-surface/95">
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-xl font-semibold">G-Chat</h1>
            <span className="rounded-full bg-gpurple-primary/10 px-3 py-1 text-xs font-medium text-gpurple-primary">
              Phase 1
            </span>
          </div>
        </header>

        <main className="flex-1 p-4">
          <div className="space-y-4">
            <div className="rounded-gcard border border-gborder bg-white p-4 dark:border-gdark-border dark:bg-gdark-surface">
              <h2 className="font-heading text-lg font-semibold">
                Welcome to G-Chat
              </h2>
              <p className="mt-2 text-sm text-gmuted dark:text-gdark-muted">
                Create an account or sign in to start real messaging.
              </p>
            </div>

            <AuthForm />
          </div>
        </main>
      </div>
    );
  }

  const showChatList = tab === "chats" && !activeChat;
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-gbackground dark:bg-gdark-background">
      <header className="sticky top-0 z-20 border-b border-gborder bg-white/95 px-4 py-3 backdrop-blur dark:border-gdark-border dark:bg-gdark-surface/95">
        {tab === "chats" && activeChat ? (
          <div className="flex items-center gap-3">
            <button
              aria-label="Back"
              onClick={() => setActiveChatId(null)}
              className="rounded-full p-2 hover:bg-gborder/40 dark:hover:bg-gdark-border/40"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ggreen-primary/10 font-heading font-semibold text-ggreen-primary">
              {activeChat.name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="truncate font-heading text-lg font-semibold leading-6">
                {activeChat.name}
              </h1>
              <p className="text-xs text-gmuted dark:text-gdark-muted">
                Invite ID: {activeChat.id.slice(0, 8)}
              </p>
            </div>

            <button
              onClick={copyInviteId}
              aria-label="Copy invite ID"
              className="rounded-full p-2 hover:bg-gborder/40 dark:hover:bg-gdark-border/40"
            >
              <Copy className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-heading text-xl font-semibold">G-Chat</h1>
              <p className="truncate text-xs text-gmuted dark:text-gdark-muted">
                {user.email ?? "Signed in"}
              </p>
            </div>

            <button
              onClick={signOut}
              aria-label="Sign out"
              className="rounded-full p-2 text-gmuted hover:bg-gborder/40 dark:text-gdark-muted dark:hover:bg-gdark-border/40"
            >
              <LogOut className="h-5 w-5" />
            </button>          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto">
        {error ? (
          <div className="mx-4 mt-4 rounded-gcard border border-gerror/30 bg-gerror/10 p-3 text-sm text-gerror">
            {error}
          </div>
        ) : null}

        {copied ? (
          <div className="mx-4 mt-4 rounded-gcard border border-ggreen-primary/30 bg-ggreen-primary/10 p-3 text-sm text-ggreen-primary">
            Invite ID copied.
          </div>
        ) : null}

        {tab === "chats" && activeChat ? (
          <section className="flex min-h-full flex-col justify-end gap-3 p-4 pb-36">
            {messages.length === 0 ? (
              <div className="rounded-gcard border border-gborder bg-white p-4 text-sm text-gmuted dark:border-gdark-border dark:bg-gdark-surface dark:text-gdark-muted">
                Send your first real message.
              </div>
            ) : null}

            {messages.map((message) => {
              const isOwnMessage = message.user_id === user.id;

              const senderName =
                message.profiles?.display_name ||
                message.profiles?.username ||
                "G-User";

              if (isOwnMessage) {
                return (
                  <article
                    key={message.id}
                    className="ml-auto w-fit max-w-[85%] rounded-gbubble bg-ggreen-primary px-4 py-3 text-white shadow-sm"
                  >
                    <p className="whitespace-pre-wrap break-words text-[15px]">
                      {message.text}
                    </p>
                    <p className="mt-1 text-right text-[11px] text-white/80">
                      {formatTime(message.created_at)} ✓✓
                    </p>
                  </article>
                );
              }

              return (                <article
                  key={message.id}
                  className="mr-auto w-fit max-w-[85%] rounded-gbubble bg-glight-bubble px-4 py-3 text-gtext shadow-sm dark:bg-gdark-bubble dark:text-gdark-text"
                >
                  <p className="text-xs font-medium text-gpurple-primary">
                    {senderName}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-[15px]">
                    {message.text}
                  </p>
                  <p className="mt-1 text-right text-[11px] text-gmuted dark:text-gdark-muted">
                    {formatTime(message.created_at)}
                  </p>
                </article>
              );
            })}

            <div ref={messagesEndRef} />
          </section>
        ) : null}

        {showChatList ? (
          <section className="space-y-4 p-4 pb-36">
            <div className="rounded-gcard border border-gborder bg-white p-4 dark:border-gdark-border dark:bg-gdark-surface">
              <h2 className="font-heading text-lg font-semibold">
                Join existing chat
              </h2>
              <p className="mt-2 text-sm text-gmuted dark:text-gdark-muted">
                Paste a chat ID to join a shared conversation.
              </p>

              <div className="mt-3 flex gap-2">
                <input
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value)}
                  placeholder="Paste chat ID"
                  className="min-h-[48px] flex-1 rounded-gbutton border border-gborder bg-white px-4 py-3 text-[15px] outline-none focus:border-ggreen-primary dark:border-gdark-border dark:bg-gdark-surface"
                />

                <GButton onClick={joinChat}>Join</GButton>
              </div>
            </div>

            {loadingChats ? (
              <div className="rounded-gcard border border-gborder bg-white p-4 text-sm text-gmuted dark:border-gdark-border dark:bg-gdark-surface dark:text-gdark-muted">
                Loading chats...
              </div>
            ) : null}

            {chats.length === 0 && !loadingChats ? (              <div className="rounded-gcard border border-gborder bg-white p-6 dark:border-gdark-border dark:bg-gdark-surface">
                <h2 className="font-heading text-lg font-semibold">
                  Create your first real chat
                </h2>
                <p className="mt-2 text-sm text-gmuted dark:text-gdark-muted">
                  This chat is stored in your Supabase database and supports
                  realtime messaging.
                </p>
                <div className="mt-4">
                  <GButton onClick={createChat} disabled={creatingChat}>
                    {creatingChat ? "Creating..." : "Create chat"}
                  </GButton>
                </div>
              </div>
            ) : null}

            {chats.length > 0 ? (
              <div className="space-y-2">
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setActiveChatId(chat.id)}
                    className="w-full rounded-gcard border border-gborder bg-white p-3 text-left hover:border-ggreen-primary/50 dark:border-gdark-border dark:bg-gdark-surface"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ggreen-primary/10 font-heading font-semibold text-ggreen-primary">
                        {chat.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{chat.name}</p>
                        <p className="truncate text-sm text-gmuted dark:text-gdark-muted">
                          Created {formatDate(chat.created_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {tab === "feed" ? (
          <EmptyPanel
            title="G-Feed"
            text="G-Feed is active. Social posts, stories, and monetized creator content connect here in the next build phase."
          />
        ) : null}
        {tab === "calls" ? (
          <EmptyPanel
            title="Calls"
            text="Calls is active. Voice and video calling infrastructure connects here in the next build phase."
          />
        ) : null}

        {tab === "wallet" ? (
          <EmptyPanel
            title="Wallet"
            text="Wallet is active. Payments, payouts, and ad revenue share connect here in the next build phase."
          />
        ) : null}
      </main>

      {tab === "chats" && activeChat ? (
        <footer className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t border-gborder bg-white/95 p-3 backdrop-blur dark:border-gdark-border dark:bg-gdark-surface/95">
          <div className="mx-auto flex w-full max-w-md items-end gap-2">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Message"
              rows={1}
              className="max-h-32 min-h-[48px] flex-1 resize-y rounded-gbutton border border-gborder bg-white px-4 py-3 text-[15px] outline-none focus:border-ggreen-primary dark:border-gdark-border dark:bg-gdark-surface"
            />

            <button
              onClick={sendMessage}
              aria-label="Send message"
              className="flex h-12 w-12 items-center justify-center rounded-gbutton bg-ggreen-primary text-white active:bg-ggreen-deep"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </footer>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-gborder bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-gdark-border dark:bg-gdark-surface/95">
        <div className="mx-auto grid h-16 w-full max-w-md grid-cols-5 items-center px-2">
          <TabButton
            active={tab === "chats"}
            label="Chats"
            onClick={() => {
              setTab("chats");              setActiveChatId(null);
            }}
            icon={<MessageCircle className="h-5 w-5" />}
          />

          <TabButton
            active={tab === "feed"}
            label="Feed"
            onClick={() => setTab("feed")}
            icon={<Newspaper className="h-5 w-5" />}
          />

          <div className="flex justify-center">
            <button
              onClick={createChat}
              aria-label="New chat"
              className="-mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-ggreen-primary text-white shadow-lg shadow-ggreen-primary/30 active:bg-ggreen-deep"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>

          <TabButton
            active={tab === "calls"}
            label="Calls"
            onClick={() => setTab("calls")}
            icon={<Phone className="h-5 w-5" />}
          />

          <TabButton
            active={tab === "wallet"}
            label="Wallet"
            onClick={() => setTab("wallet")}
            icon={<Wallet className="h-5 w-5" />}
          />
        </div>
      </nav>
    </div>
  );
}

function SetupScreen() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-gbackground dark:bg-gdark-background">
      <header className="sticky top-0 z-20 border-b border-gborder bg-white/95 px-4 py-3 backdrop-blur dark:border-gdark-border dark:bg-gdark-surface/95">
        <h1 className="font-heading text-xl font-semibold">G-Chat Setup</h1>
      </header>

      <main className="flex-1 p-4">
        <div className="rounded-gcard border border-gwarning/40 bg-gwarning/10 p-4">          <h2 className="font-heading text-lg font-semibold">
            Supabase environment variables are missing
          </h2>

          <p className="mt-2 text-sm text-gtext dark:text-gdark-text">
            Add these environment variables in Vercel, then redeploy:
          </p>

          <ul className="mt-3 list-disc pl-5 text-sm text-gtext dark:text-gdark-text">
            <li>NEXT_PUBLIC_SUPABASE_URL</li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
          </ul>

          <p className="mt-3 text-sm text-gtext dark:text-gdark-text">
            You can find them in Supabase under Project Settings → API.
          </p>
        </div>
      </main>
    </div>
  );
}

function EmptyPanel({ title, text }: { title: string; text: string }) {
  return (
    <section className="p-4 pb-36">
      <div className="rounded-gcard border border-gborder bg-white p-6 dark:border-gdark-border dark:bg-gdark-surface">
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-gmuted dark:text-gdark-muted">
          {text}
        </p>
      </div>
    </section>
  );
}

function TabButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}      className={`flex flex-col items-center gap-1 rounded-lg px-2 py-1 text-xs ${
        active
          ? "text-gpurple-primary"
          : "text-gmuted dark:text-gdark-muted"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}