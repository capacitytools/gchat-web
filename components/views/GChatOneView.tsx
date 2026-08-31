"use client";

import { Plus, Building2, CheckCircle2, BarChart3, MessageCircleReply, Users2, Settings } from "lucide-react";

type BusinessProfile = { id: string; user_id: string; business_name: string; category: string; description: string; is_verified: boolean; auto_reply_enabled: boolean; auto_reply_message: string | null; };

interface GChatOneViewProps {
  businessProfile: BusinessProfile | null;
  onSetupBusiness: () => void;
}

export function GChatOneView({ businessProfile, onSetupBusiness }: GChatOneViewProps) {
  return (
    <div className="relative z-10 flex flex-col min-h-screen pb-24">
      <header className="sticky top-0 z-20 bg-[#020617]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">G-Chat One</h1>
        {!businessProfile && <button onClick={onSetupBusiness} className="p-2 rounded-full bg-emerald-500/20 text-emerald-400"><Plus className="h-5 w-5" /></button>}
      </header>
      <div className="flex-1 overflow-y-auto p-4">
        {!businessProfile ? (
          <div className="text-center py-20">
            <Building2 className="h-16 w-16 mx-auto mb-4 text-emerald-400" />
            <h2 className="text-xl font-bold mb-2">Turn Your Chat Into Business</h2>
            <p className="text-sm text-gray-400 mb-6">Get AI Auto-Reply, Analytics, and Customer Management.</p>
            <button onClick={onSetupBusiness} className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 font-bold">Setup Business</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-cyan-700">
              <h2 className="text-xl font-bold">{businessProfile.business_name}</h2>
              <p className="text-sm text-emerald-100">{businessProfile.category}</p>
              {businessProfile.is_verified && <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded bg-white/20 text-xs"><CheckCircle2 className="h-3 w-3" /> Verified</span>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 rounded-xl bg-white/5 border border-white/5 text-left"><BarChart3 className="h-6 w-6 text-cyan-400 mb-2" /><p className="text-sm font-medium">Analytics</p></button>
              <button className="p-4 rounded-xl bg-white/5 border border-white/5 text-left"><MessageCircleReply className="h-6 w-6 text-purple-400 mb-2" /><p className="text-sm font-medium">AI Auto-Reply {businessProfile.auto_reply_enabled ? '✅' : '❌'}</p></button>
              <button className="p-4 rounded-xl bg-white/5 border border-white/5 text-left"><Users2 className="h-6 w-6 text-pink-400 mb-2" /><p className="text-sm font-medium">Customers</p></button>
              <button className="p-4 rounded-xl bg-white/5 border border-white/5 text-left"><Settings className="h-6 w-6 text-orange-400 mb-2" /><p className="text-sm font-medium">Settings</p></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}