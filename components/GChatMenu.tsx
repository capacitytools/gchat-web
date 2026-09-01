"use client";

import { Users, Wallet, Bot, Rss } from "lucide-react";

type View = "home" | "list" | "conversation" | "wallet" | "feed" | "gtribe" | "gchatone" | "profile" | "edit-profile" | "analytics" | "settings";

const MENU_ITEMS = [
  { 
    icon: Users, 
    label: "G-Tribe", 
    sub: "Groups & Communities", 
    view: "gtribe" as View 
  },
  { 
    icon: Wallet, 
    label: "G-Pay", 
    sub: "Wallet & Earn", 
    view: "wallet" as View 
  },
  { 
    icon: Bot, 
    label: "G-Chat One", 
    sub: "Business & AI", 
    view: "gchatone" as View 
  },
  { 
    icon: Rss, 
    label: "G-Feed", 
    sub: "Social Posts", 
    view: "feed" as View 
  },
];

interface GChatMenuProps {
  onNavigate: (view: View) => void;
}

export function GChatMenu({ onNavigate }: GChatMenuProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {MENU_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            onClick={() => onNavigate(item.view)}
            className="gchat-menu-card rounded-2xl p-5 text-left"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 mb-3">
              <Icon className="h-6 w-6 text-[#FFD700]" />
            </div>
            <p className="gchat-menu-label font-semibold text-base">{item.label}</p>
            <p className="gchat-menu-sub text-xs">{item.sub}</p>
          </button>
        );
      })}
    </div>
  );
}