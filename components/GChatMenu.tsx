"use client";

import { GTribeIcon, GPayIcon, GChatOneIcon, GFeedIcon } from "./icons/AnimatedIcons";

type View = "home" | "list" | "conversation" | "wallet" | "feed" | "gtribe" | "gchatone" | "profile" | "edit-profile" | "analytics" | "settings";

interface GChatMenuProps {
  onNavigate: (view: View) => void;
}

export function GChatMenu({ onNavigate }: GChatMenuProps) {
  return (
    <div className="gchat-menu-grid">
      <div className="gchat-menu-card">
        <GTribeIcon onClick={() => onNavigate("gtribe")} />
        <span className="gchat-menu-label">G-Tribe</span>
        <span className="gchat-menu-sub">Groups & Communities</span>
      </div>
      <div className="gchat-menu-card">
        <GPayIcon onClick={() => onNavigate("wallet")} />
        <span className="gchat-menu-label">G-Pay</span>
        <span className="gchat-menu-sub">Wallet & Earn</span>
      </div>
      <div className="gchat-menu-card">
        <GChatOneIcon onClick={() => onNavigate("gchatone")} />
        <span className="gchat-menu-label">G-Chat One</span>
        <span className="gchat-menu-sub">Business & AI</span>
      </div>
      <div className="gchat-menu-card">
        <GFeedIcon onClick={() => onNavigate("feed")} />
        <span className="gchat-menu-label">G-Feed</span>
        <span className="gchat-menu-sub">Social Posts</span>
      </div>
    </div>
  );
}