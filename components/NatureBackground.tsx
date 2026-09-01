/* ============================================================
   G-CHAT NATURE SANCTUARY — visual layer
   ============================================================ */

.nature-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

/* Deep forest green -> charcoal */
.nature-base {
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, #0A1A0A 0%, #0c140c 45%, #0D0D0D 100%);
}

/* ---- God rays (upper-left, swaying + breathing) ---- */
.nature-rays {
  position: absolute;
  inset: -20%;
  background:
    radial-gradient(ellipse at 12% 8%, rgba(255, 215, 0, 0.22), transparent 55%),
    linear-gradient(115deg, rgba(255, 215, 0, 0.12) 0%, transparent 40%);
  filter: blur(30px);
  transform-origin: 10% 5%;
  animation: raySway 60s ease-in-out infinite alternate, rayPulse 8s ease-in-out infinite;
  will-change: transform, opacity;
}

/* ---- Mist layers (3 depths, parallax drift) ---- */
.nature-mist {
  position: absolute;
  inset: 0;
  filter: blur(40px);
  will-change: transform, opacity;
}

.mist-1 {
  background: radial-gradient(60% 40% at 70% 60%, rgba(255, 240, 200, 0.10), transparent 70%);
  animation: mistDrift1 120s linear infinite alternate;
}

.mist-2 {
  background: radial-gradient(50% 35% at 30% 45%, rgba(255, 245, 230, 0.08), transparent 70%);
  animation: mistDrift2 90s linear infinite alternate;
}

.mist-3 {
  background: radial-gradient(70% 45% at 50% 80%, rgba(255, 235, 190, 0.12), transparent 70%);
  animation: mistBreathe 12s ease-in-out infinite;
}

.nature-canvas {
  position: absolute;
  inset: 0;
  z-index: 1;
}

/* ---- Flowing water (bottom) ---- */
.nature-water {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 18%;
  z-index: 2;
}

.nature-wave {
  position: absolute;
  bottom: 0;
  left: -5%;
  width: 110%;
  height: 100%;
}

.wave-back {
  animation: waveSway 10s ease-in-out infinite alternate;
  opacity: .8;
}

.wave-front {
  animation: waveSway 7s ease-in-out infinite alternate-reverse;
}

.nature-water-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.07), transparent);
  background-size: 40% 100%;
  background-repeat: no-repeat;
  animation: shimmerSlide 7s ease-in-out infinite;
}

/* ============================================================
   TYPOGRAPHY — warm white + gold
   ============================================================ */
.nature-title {
  color: #FFF5E6;
  text-shadow: 0 2px 14px rgba(0, 0, 0, .55);
}

.nature-gold {
  color: #FFD700;
  text-shadow: 0 0 18px rgba(255, 215, 0, .35);
}

.nature-sub {
  color: rgba(255, 245, 230, .6);
}

/* Entry animation (staggered via inline delay) */
.nature-enter {
  animation: cardIn .6s ease both;
}

/* ============================================================
   GOLD-TRIMMED GLASS CARDS (scoped to homepage)
   ============================================================ */
.nature-page .gchat-menu-card {
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 215, 0, 0.15);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, .35), inset 0 1px 0 rgba(255, 255, 255, .08);
  transition: transform .35s ease, border-color .35s ease, box-shadow .35s ease;
  animation: cardIn .6s ease both, cardBreathe 4s ease-in-out infinite;
}

/* Staggered entry + breathe offsets */
.nature-page .gchat-menu-card:nth-child(1) {
  animation-delay: .2s, .8s;
}
.nature-page .gchat-menu-card:nth-child(2) {
  animation-delay: .4s, 1s;
}
.nature-page .gchat-menu-card:nth-child(3) {
  animation-delay: .6s, 1.2s;
}
.nature-page .gchat-menu-card:nth-child(4) {
  animation-delay: .8s, 1.4s;
}

/* Hover: gentle lift + golden glow */
.nature-page .gchat-menu-card:hover {
  transform: translateY(-8px);
  border-color: rgba(255, 215, 0, .35);
  box-shadow: 0 18px 44px rgba(0, 0, 0, .5), 0 0 26px rgba(255, 215, 0, .15);
}

/* Slow diagonal glass shimmer sweep (10s cycle) */
.nature-page .gchat-menu-card::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(115deg, transparent 30%, rgba(255, 245, 230, 0.10) 48%, rgba(255, 215, 0, 0.08) 52%, transparent 70%);
  transform: translateX(-120%);
  animation: glassShimmer 10s ease-in-out infinite;
  pointer-events: none;
}

/* Warm label colors */
.nature-page .gchat-menu-label {
  color: rgba(255, 245, 230, .85);
}

.nature-page .gchat-menu-sub {
  color: rgba(255, 215, 0, .45);
}

/* Composer bar */
.nature-composer {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 215, 0, 0.18);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, .35), inset 0 1px 0 rgba(255, 255, 255, .08);
  transition: transform .35s ease, box-shadow .35s ease, border-color .35s ease;
}

.nature-composer:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 215, 0, .35);
  box-shadow: 0 16px 40px rgba(0, 0, 0, .45), 0 0 24px rgba(255, 215, 0, .12);
}

/* ============================================================
   RESPONSIVE + PERFORMANCE
   ============================================================ */
@media (max-width: 768px) {
  /* Lighter blur on phones */
  .nature-page .gchat-menu-card,
  .nature-composer {
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }
  .nature-mist {
    filter: blur(24px);
  }
}

/* Accessibility: calm everything for reduced-motion users */
@media (prefers-reduced-motion: reduce) {
  .nature-bg *,
  .nature-page .gchat-menu-card,
  .nature-enter,
  .nature-composer {
    animation: none !important;
    transition: none !important;
  }
}

/* ============================================================
   ALL ANIMATIONS — defined here
   ============================================================ */
@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes cardBreathe {
  0%, 100% {
    scale: 1;
  }
  50% {
    scale: 1.005;
  }
}

@keyframes glassShimmer {
  0%, 55% {
    transform: translateX(-120%);
  }
  100% {
    transform: translateX(120%);
  }
}

@keyframes raySway {
  from {
    transform: rotate(-4deg);
  }
  to {
    transform: rotate(11deg);
  }
}

@keyframes rayPulse {
  0%, 100% {
    opacity: .5;
  }
  50% {
    opacity: 1;
  }
}

@keyframes mistDrift1 {
  from {
    transform: translateX(6%);
  }
  to {
    transform: translateX(-6%);
  }
}

@keyframes mistDrift2 {
  from {
    transform: translateX(-7%);
  }
  to {
    transform: translateX(7%);
  }
}

@keyframes mistBreathe {
  0%, 100% {
    transform: translateY(0);
    opacity: .7;
  }
  50% {
    transform: translateY(-14px);
    opacity: 1;
  }
}

@keyframes waveSway {
  from {
    transform: translateX(-2.5%);
  }
  to {
    transform: translateX(2.5%);
  }
}

@keyframes shimmerSlide {
  0% {
    background-position: -60% 0;
  }
  100% {
    background-position: 160% 0;
  }
}