"use client";

export function GChatBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#020617]">
      {/* Base Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0B1120] to-slate-950" />
      
      {/* Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px]" />

      {/* Network Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Subtle Scan Line */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-[200%] animate-[scan_8s_linear_infinite]" />
    </div>
  );
}