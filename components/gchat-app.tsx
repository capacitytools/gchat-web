"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  MessageCircle,
  Newspaper,
  Phone,
  Plus,
  Send,
  Wallet,
} from "lucide-react";
import { GButton } from "@/components/gbutton";

type MessageStatus = "queued" | "sent" | "delivered" | "read";

type ChatMessage = {
  id: string;
  text: string;
  createdAt: number;
  status: MessageStatus;
};

type Chat = {
  id: string;
  name: string;
  updatedAt: number;
  messages: ChatMessage[];
};

type Tab = "chats" | "feed" | "calls" | "wallet";

const STORAGE_KEY = "gchat.local.v1";

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadChats(): Chat[] {
  if (typeof window === "undefined") {    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as Chat[];
  } catch {
    return [];
  }
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GChatApp() {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("chats");
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    setChats(loadChats());
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  }, [chats, mounted]);
  const activeChat = useMemo(() => {
    return chats.find((chat) => chat.id === activeChatId) ?? null;
  }, [chats, activeChatId]);

  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [chats]);

  const activeChatMessageCount = activeChat?.messages.length ?? 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [activeChatMessageCount, activeChatId]);

  function createChat() {
    const chat: Chat = {
      id: createId(),
      name: "New conversation",
      updatedAt: Date.now(),
      messages: [],
    };

    setChats((previousChats) => [chat, ...previousChats]);
    setActiveChatId(chat.id);
    setTab("chats");
  }

  function sendMessage() {
    const text = draft.trim();

    if (!text || !activeChat) {
      return;
    }

    const message: ChatMessage = {
      id: createId(),
      text,
      createdAt: Date.now(),
      status: "sent",
    };

    setChats((previousChats) => {
      return previousChats.map((chat) => {
        if (chat.id !== activeChat.id) {
          return chat;
        }

        return {
          ...chat,          messages: [...chat.messages, message],
          updatedAt: Date.now(),
        };
      });
    });

    setDraft("");
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

            <div>
              <h1 className="font-heading text-lg font-semibold leading-6">
                {activeChat.name}
              </h1>
              <p className="text-xs text-gmuted dark:text-gdark-muted">
                Local MVP chat
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-xl font-semibold">G-Chat</h1>            <span className="rounded-full bg-gpurple-primary/10 px-3 py-1 text-xs font-medium text-gpurple-primary">
              MVP
            </span>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto">
        {tab === "chats" && activeChat ? (
          <section className="flex min-h-full flex-col justify-end gap-3 p-4 pb-36">
            {activeChat.messages.length === 0 ? (
              <div className="rounded-gcard border border-gborder bg-white p-4 text-sm text-gmuted dark:border-gdark-border dark:bg-gdark-surface dark:text-gdark-muted">
                Send your first message. Messages are stored locally on this
                device in this MVP phase.
              </div>
            ) : null}

            {activeChat.messages.map((message) => (
              <article
                key={message.id}
                className="ml-auto w-fit max-w-[85%] rounded-gbubble bg-ggreen-primary px-4 py-3 text-white shadow-sm"
              >
                <p className="whitespace-pre-wrap break-words text-[15px]">
                  {message.text}
                </p>
                <p className="mt-1 text-right text-[11px] text-white/80">
                  {formatTime(message.createdAt)} ✓✓
                </p>
              </article>
            ))}

            <div ref={messagesEndRef} />
          </section>
        ) : null}

        {showChatList ? (
          <section className="p-4 pb-36">
            {sortedChats.length === 0 ? (
              <div className="rounded-gcard border border-gborder bg-white p-6 dark:border-gdark-border dark:bg-gdark-surface">
                <h2 className="font-heading text-lg font-semibold">
                  Start your first local chat
                </h2>
                <p className="mt-2 text-sm text-gmuted dark:text-gdark-muted">
                  This is the offline-first shell. Tap the green button to
                  create a local conversation.
                </p>
                <div className="mt-4">
                  <GButton onClick={createChat}>Create local chat</GButton>
                </div>
              </div>            ) : (
              <div className="space-y-2">
                {sortedChats.map((chat) => (
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
                          {chat.messages.length > 0
                            ? chat.messages[chat.messages.length - 1].text
                            : "No messages yet"}
                        </p>
                      </div>

                      <span className="text-xs text-gmuted dark:text-gdark-muted">
                        {formatTime(chat.updatedAt)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
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
            title="Wallet"            text="Wallet is active. Payments, payouts, and ad revenue share connect here in the next build phase."
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
              setTab("chats");
              setActiveChatId(null);
            }}
            icon={<MessageCircle className="h-5 w-5" />}
          />

          <TabButton
            active={tab === "feed"}
            label="Feed"
            onClick={() => setTab("feed")}
            icon={<Newspaper className="h-5 w-5" />}          />

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
}: {  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex flex-col items-center gap-1 rounded-lg px-2 py-1 text-xs ${
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