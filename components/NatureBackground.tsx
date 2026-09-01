"use client";

import { useEffect, useRef } from "react";
import "./nature.css";

/*
  NATURE SANCTUARY BACKGROUND
  - Canvas: diagonal rain (15°), splash ripples, wandering fireflies
  - CSS: god-rays, 3 parallax mist layers, flowing water + shimmer
  - Performance: capped DPR, responsive particle counts, debounced resize,
    respects prefers-reduced-motion.
*/
export function NatureBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let running = true;

    type Drop = { x: number; y: number; len: number; speed: number; op: number };
    type Fly = { x: number; y: number; r: number; t: number; sx: number; sy: number; hue: string };
    type Ripple = { x: number; y: number; r: number; max: number; a: number };

    let drops: Drop[] = [];
    let flies: Fly[] = [];
    let ripples: Ripple[] = [];

    const spawnDrop = (anywhere = false): Drop => ({
      x: Math.random() * (width + 100) - 50,
      y: anywhere ? Math.random() * height : -30,
      len: 8 + Math.random() * 10,
      speed: 0.6 + Math.random() * 0.8,
      op: 0.2 + Math.random() * 0.3,
    });

    const spawnFly = (): Fly => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1 + Math.random() * 2.5,
      t: Math.random() * Math.PI * 2,
      sx: 0.15 + Math.random() * 0.25,
      sy: 0.08 + Math.random() * 0.2,
      hue: Math.random() < 0.33 ? "255,215,0" : Math.random() < 0.66 ? "0,240,255" : "255,245,230",
    });

    const waterTop = () => height * 0.84;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1200;
      const rainCount = isMobile ? 100 : isTablet ? 140 : 200;
      const flyCount = isMobile ? 16 : isTablet ? 22 : 30;

      drops = Array.from({ length: rainCount }, () => spawnDrop(true));
      flies = Array.from({ length: flyCount }, () => spawnFly());
    };

    let last = performance.now();
    const frame = (now: number) => {
      if (!running) return;
      const dt = Math.min(now - last, 50);
      last = now;
      ctx.clearRect(0, 0, width, height);

      const angle = 0.26;

      // ---- RAIN ----
      ctx.lineWidth = 1;
      ctx.lineCap = "round";
      for (const d of drops) {
        d.y += d.speed * dt * 0.06;
        d.x += d.speed * dt * 0.06 * angle;
        ctx.strokeStyle = `rgba(200, 230, 255, ${d.op})`;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.len * angle, d.y - d.len);
        ctx.stroke();

        if (d.y > waterTop()) {
          if (ripples.length < 40) {
            ripples.push({
              x: d.x,
              y: waterTop() + Math.random() * (height - waterTop()) * 0.5,
              r: 1,
              max: 8 + Math.random() * 10,
              a: 0.35,
            });
          }
          Object.assign(d, spawnDrop());
        }
      }

      // ---- RIPPLES ----
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.r += dt * 0.02;
        r.a -= dt * 0.0004;
        if (r.a <= 0 || r.r > r.max) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = `rgba(180, 240, 255, ${r.a})`;
        ctx.lineWidth = 1.5 - (r.r / r.max) * 0.8;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.r, r.r * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // ---- FIREFLIES ----
      for (const f of flies) {
        f.t += dt * 0.001;
        f.x += Math.sin(f.t * 1.7) * f.sx;
        f.y += Math.cos(f.t * 1.3) * f.sy - 0.05;

        if (f.y < -10) { f.y = height + 10; f.x = Math.random() * width; }
        if (f.x < -10) f.x = width + 10;
        if (f.x > width + 10) f.x = -10;

        const pulse = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(f.t * 3));
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 5);
        g.addColorStop(0, `rgba(${f.hue},${pulse})`);
        g.addColorStop(0.3, `rgba(${f.hue},${pulse * 0.5})`);
        g.addColorStop(1, `rgba(${f.hue},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${f.hue},${pulse * 0.8})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    };

    resize();
    let resizeTimer: any;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    };
    window.addEventListener("resize", onResize);

    if (!reduced) raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  return (
    <div className="nature-bg" aria-hidden="true">
      {/* Deep forest gradient base */}
      <div className="nature-base" />
      {/* Golden god-rays from upper-left */}
      <div className="nature-rays" />
      {/* Parallax mist layers */}
      <div className="nature-mist mist-1" />
      <div className="nature-mist mist-2" />
      <div className="nature-mist mist-3" />
      {/* Canvas: rain + ripples + fireflies */}
      <canvas ref={canvasRef} className="nature-canvas" />
      {/* Flowing water at the bottom */}
      <div className="nature-water">
        <svg className="nature-wave wave-back" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,60 C150,100 350,20 600,60 C850,100 1050,20 1200,60 L1200,120 L0,120 Z" fill="rgba(26, 90, 90, 0.5)">
            <animate attributeName="d" dur="8s" repeatCount="indefinite"
              values="
                M0,60 C150,100 350,20 600,60 C850,100 1050,20 1200,60 L1200,120 L0,120 Z;
                M0,70 C200,30 400,110 600,70 C800,30 1000,110 1200,70 L1200,120 L0,120 Z;
                M0,60 C150,100 350,20 600,60 C850,100 1050,20 1200,60 L1200,120 L0,120 Z
              " />
          </path>
        </svg>
        <svg className="nature-wave wave-front" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,70 C200,30 400,110 600,70 C800,30 1000,110 1200,70 L1200,120 L0,120 Z" fill="rgba(10, 58, 58, 0.85)">
            <animate attributeName="d" dur="5s" repeatCount="indefinite"
              values="
                M0,70 C200,30 400,110 600,70 C800,30 1000,110 1200,70 L1200,120 L0,120 Z;
                M0,80 C150,40 350,100 600,80 C850,40 1050,100 1200,80 L1200,120 L0,120 Z;
                M0,70 C200,30 400,110 600,70 C800,30 1000,110 1200,70 L1200,120 L0,120 Z
              " />
          </path>
        </svg>
        <div className="nature-water-shimmer" />
      </div>
    </div>
  );
}