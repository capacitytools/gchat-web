"use client";

import { Plus, Users2 } from "lucide-react";

type Group = { id: string; name: string; description: string; owner_id: string; group_type: string; member_count: number; created_at: string; };

interface GTribeViewProps {
  groups: Group[];
  onCreateGroup: () => void;
}

export function GTribeView({ groups, onCreateGroup }: GTribeViewProps) {
  return (
    <div className="relative z-10 flex flex-col min-h-screen pb-24">
      <header className="sticky top-0 z-20 bg-[#020617]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">G-Tribe</h1>
        <button onClick={onCreateGroup} className="p-2 rounded-full bg-emerald-500/20 text-emerald-400"><Plus className="h-5 w-5" /></button>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {groups.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Users2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>No groups yet. Create one!</p>
          </div>
        ) : groups.map((group) => (
          <button key={group.id} className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center font-bold">{group.name.charAt(0).toUpperCase()}</div>
              <div className="flex-1"><h3 className="font-bold text-white">{group.name}</h3><p className="text-xs text-gray-400">{group.member_count} members • {group.group_type}</p></div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}