"use client";

import { useState, useCallback } from "react";
import "./gchat-icons.css";

/*
  G-CHAT LIVING ICONS
  Pure SVG + CSS (no Lottie dependency = 0KB extra, faster than the 150KB budget).
  Each icon: ambient loop + hover micro-interaction + click particle burst.
*/

interface IconProps { onClick?: () => void; }

/* Shared shell: accessibility label + click burst micro-interaction */
function IconShell({ label, onClick, children }: { label: string; onClick?: () => void; children: React.ReactNode }) {
  const [burst, setBurst] = useState(false);
  const handleClick = useCallback(() => {
    setBurst(true);
    setTimeout(() => setBurst(false), 700);
    onClick?.();
  }, [onClick]);

  return (
    <button type="button" aria-label={label} className={`gicon-shell ${burst ? "gicon-burst" : ""}`} onClick={handleClick}>
      {children}
    </button>
  );
}

/* ============ ICON 1 — G-TRIBE ============ */
export function GTribeIcon({ onClick }: IconProps) {
  return (
    <IconShell label="G-Tribe: Groups and Communities" onClick={onClick}>
      <svg viewBox="0 0 48 48" className="gicon" aria-hidden="true">
        <defs>
          <linearGradient id="tribeRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00F0FF" /><stop offset="50%" stopColor="#B026FF" /><stop offset="100%" stopColor="#FF2D95" />
          </linearGradient>
          <radialGradient id="orbGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" stopOpacity=".95" /><stop offset="45%" stopColor="#00F0FF" stopOpacity=".6" /><stop offset="100%" stopColor="#00F0FF" stopOpacity="0" />
          </radialGradient>
          <filter id="tribeBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>

        {/* Volumetric fog beneath the ring */}
        <ellipse className="tribe-fog" cx="24" cy="40" rx="14" ry="4" fill="#B026FF" filter="url(#tribeBlur)" />

        {/* Constellation web (flickers like neural signals) */}
        <g className="tribe-web" stroke="#00F0FF" strokeWidth="0.4">
          <line x1="24" y1="8" x2="39.6" y2="27.6" /><line x1="39.6" y1="27.6" x2="17.1" y2="38.4" />          <line x1="17.1" y1="38.4" x2="11.5" y2="14" /><line x1="11.5" y1="14" x2="36.5" y2="14" />
          <line x1="36.5" y1="14" x2="30.9" y2="38.4" /><line x1="30.9" y1="38.4" x2="8.4" y2="27.6" />
          <line x1="8.4" y1="27.6" x2="24" y2="8" />
        </g>

        {/* Rotating obsidian ring */}
        <g className="tribe-ring">
          <circle cx="24" cy="24" r="16" fill="none" stroke="url(#tribeRing)" strokeWidth="1.6" opacity=".85" />
          <circle cx="24" cy="24" r="16" fill="none" stroke="#fff" strokeWidth=".3" opacity=".3" />
        </g>

        {/* 7 glowing orbs, pulsing in a wave */}
        {[[24,8],[36.5,14],[39.6,27.6],[30.9,38.4],[17.1,38.4],[8.4,27.6],[11.5,14]].map(([x,y],i)=>(
          <g key={i} className="tribe-orb" style={{ animationDelay: `${i*0.35}s` }}>
            <circle cx={x} cy={y} r="4.5" fill="url(#orbGlow)" />
            <circle cx={x} cy={y} r="1.8" fill="#fff" opacity=".9" />
          </g>
        ))}
      </svg>
    </IconShell>
  );
}

/* ============ ICON 2 — G-PAY ============ */
export function GPayIcon({ onClick }: IconProps) {
  return (
    <IconShell label="G-Pay: Wallet and Earn" onClick={onClick}>
      <svg viewBox="0 0 48 48" className="gicon" aria-hidden="true">
        <defs>
          <linearGradient id="goldSide" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFE29A" /><stop offset="55%" stopColor="#FFB800" /><stop offset="100%" stopColor="#B8860B" />
          </linearGradient>
          <linearGradient id="holoSide" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#00FF9C" /><stop offset="100%" stopColor="#00F0FF" />
          </linearGradient>
          <linearGradient id="infGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFB800" /><stop offset="50%" stopColor="#00FF9C" /><stop offset="100%" stopColor="#B026FF" />
          </linearGradient>
        </defs>

        {/* Faceted diamond: liquid gold left, holographic right */}
        <g className="pay-diamond">
          <polygon points="24,4 14,14 24,26" fill="url(#goldSide)" opacity=".95" />
          <polygon points="24,4 34,14 24,26" fill="url(#holoSide)" opacity=".85" />
          <line x1="24" y1="4" x2="24" y2="26" stroke="#fff" strokeWidth=".4" opacity=".6" />
          <line x1="14" y1="14" x2="34" y2="14" stroke="#fff" strokeWidth=".3" opacity=".4" />
        </g>

        {/* Holographic data streams flowing upward */}
        <g stroke="url(#holoSide)" strokeWidth=".7">          <line className="pay-stream s1" x1="28" y1="24" x2="28" y2="8" />
          <line className="pay-stream s2" x1="31" y1="24" x2="31" y2="10" />
          <line className="pay-stream s3" x1="25.5" y1="25" x2="25.5" y2="6" />
        </g>

        {/* Levitating infinity loop with morphing currency seeds */}
        <g className="pay-infinity">
          <path d="M12 36c0-4 5-4 12 0s12 4 12 0-5-4-12 0-12 4-12 0z" fill="none" stroke="url(#infGrad)" strokeWidth="1.4" strokeLinecap="round" />
          <text className="pay-sym sym-a" x="10" y="34" fontSize="5" fill="#FFB800">$</text>
          <text className="pay-sym sym-b" x="32" y="34" fontSize="5" fill="#00FF9C">€</text>
          <text className="pay-sym sym-c" x="21.5" y="31" fontSize="4.5" fill="#B026FF">₿</text>
        </g>
      </svg>
    </IconShell>
  );
}

/* ============ ICON 3 — G-CHAT ONE ============ */
export function GChatOneIcon({ onClick }: IconProps) {
  return (
    <IconShell label="G-Chat One: Business and AI" onClick={onClick}>
      <svg viewBox="0 0 48 48" className="gicon" aria-hidden="true">
        <defs>
          <linearGradient id="headGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity=".45" /><stop offset="100%" stopColor="#00F0FF" stopOpacity=".12" />
          </linearGradient>
          <linearGradient id="neuralGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#B026FF" /><stop offset="100%" stopColor="#00F0FF" />
          </linearGradient>
        </defs>

        {/* Rotating icosahedron wireframe cage */}
        <g className="one-cage" stroke="#00F0FF" strokeWidth=".35" fill="none" opacity=".5">
          <polygon points="24,3 41,13 41,33 24,44 7,33 7,13" />
          <line x1="24" y1="3" x2="24" y2="44" /><line x1="7" y1="13" x2="41" y2="33" />
          <line x1="41" y1="13" x2="7" y2="33" /><line x1="7" y1="13" x2="41" y2="13" /><line x1="7" y1="33" x2="41" y2="33" />
        </g>

        {/* Crystal head silhouette */}
        <path className="one-head" d="M24 9c6.5 0 11 4.8 11 10.5 0 3.2-1.4 5.6-3 7.5l1.5 5.5c.2.8-.4 1.5-1.2 1.5H15.7c-.8 0-1.4-.7-1.2-1.5L16 27c-1.6-1.9-3-4.3-3-7.5C13 13.8 17.5 9 24 9z" fill="url(#headGrad)" stroke="#fff" strokeWidth=".5" opacity=".8" />

        {/* Neural thread: light travels base -> forehead */}
        <path className="one-neural" d="M24 31c-3-2-3-5 0-6s4-4 1-6-2-5 0-6" fill="none" stroke="url(#neuralGrad)" strokeWidth="1" strokeLinecap="round" />

        {/* Third eye + sine-wave ripples */}
        <circle className="one-eye" cx="24" cy="15" r="1.6" fill="#00F0FF" />
        <circle className="one-ripple r1" cx="24" cy="15" r="2" fill="none" stroke="#00F0FF" strokeWidth=".4" />
        <circle className="one-ripple r2" cx="24" cy="15" r="2" fill="none" stroke="#B026FF" strokeWidth=".4" />
      </svg>
    </IconShell>  );
}

/* ============ ICON 4 — G-FEED ============ */
export function GFeedIcon({ onClick }: IconProps) {
  return (
    <IconShell label="G-Feed: Social Posts" onClick={onClick}>
      <svg viewBox="0 0 48 48" className="gicon" aria-hidden="true">
        <defs>
          <linearGradient id="mobiusGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00F0FF" /><stop offset="50%" stopColor="#B026FF" /><stop offset="100%" stopColor="#FF2D95" />
          </linearGradient>
          <filter id="bokehBlur"><feGaussianBlur stdDeviation="1.2" /></filter>
        </defs>

        {/* Twinkling bokeh stars */}
        <g filter="url(#bokehBlur)">
          <circle className="feed-star t1" cx="8" cy="10" r="1.4" fill="#00F0FF" />
          <circle className="feed-star t2" cx="40" cy="8" r="1" fill="#FF2D95" />
          <circle className="feed-star t3" cx="42" cy="38" r="1.3" fill="#B026FF" />
          <circle className="feed-star t4" cx="6" cy="36" r=".9" fill="#fff" />
        </g>

        {/* Rotating Möbius strip of light */}
        <g className="feed-strip">
          <path d="M10 24c0-6 6-10 14-10s14 4 14 10-6 10-14 10S10 30 10 24z" fill="none" stroke="url(#mobiusGrad)" strokeWidth="1.2" opacity=".8" />
          <path d="M14 24c0-4 4.5-7 10-7s10 3 10 7-4.5 7-10 7-10-3-10-7z" fill="none" stroke="url(#mobiusGrad)" strokeWidth=".7" opacity=".6" />
          <path d="M20 17l8 14M28 17l-8 14" stroke="#fff" strokeWidth=".4" opacity=".5" />
        </g>

        {/* Drifting fragment thumbnails */}
        <g>
          <rect className="frag f1" x="12" y="15" width="4" height="3" rx=".6" fill="#00F0FF" />
          <rect className="frag f2" x="30" y="13" width="4" height="3" rx=".6" fill="#FF2D95" />
          <rect className="frag f3" x="36" y="26" width="4" height="3" rx=".6" fill="#B026FF" />
          <rect className="frag f4" x="10" y="28" width="4" height="3" rx=".6" fill="#fff" />
          <rect className="frag f5" x="22" y="33" width="4" height="3" rx=".6" fill="#00FF9C" />
        </g>
      </svg>
    </IconShell>
  );
}