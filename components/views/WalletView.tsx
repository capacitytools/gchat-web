"use client";

import { ArrowLeft, PlayCircle, Banknote } from "lucide-react";
import { format } from "date-fns";

type View = "home" | "list" | "conversation" | "wallet" | "feed" | "gtribe" | "gchatone" | "profile" | "edit-profile" | "analytics" | "settings";
type AdCampaign = { id: string; title: string; description: string; reward_amount: number; };
type Transaction = { id: string; sender_id: string; receiver_id: string; amount: number; type: string; created_at: string; };

interface WalletViewProps {
  setView: (view: View) => void;
  balance: number;
  ads: AdCampaign[];
  transactions: Transaction[];
  userId: string;
  onWatchAd: (ad: AdCampaign) => void;
  onWithdraw: () => void;
}

export function WalletView({ setView, balance, ads, transactions, userId, onWatchAd, onWithdraw }: WalletViewProps) {
  return (
    <div className="relative z-10 flex flex-col min-h-screen p-6 pb-24">
      <header className="flex justify-between items-center mb-8">
        <button onClick={() => setView("home")} className="p-2 rounded-full bg-white/5"><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-xl font-bold">G-Pay Wallet</h1>
        <div className="w-9" />
      </header>
      <div className="relative p-6 rounded-3xl bg-gradient-to-br from-emerald-600 to-cyan-700 shadow-2xl shadow-emerald-500/20 mb-8">
        <p className="text-emerald-100 text-sm mb-1">Total Balance</p>
        <h2 className="text-4xl font-bold text-white mb-6">${(balance / 100).toFixed(2)}</h2>
        <div className="flex gap-3">
          <button className="flex-1 py-2.5 rounded-xl bg-white/20 backdrop-blur text-white font-medium text-sm">Add Money</button>
          <button onClick={onWithdraw} className="flex-1 py-2.5 rounded-xl bg-white/20 backdrop-blur text-white font-medium text-sm flex items-center justify-center gap-2"><Banknote className="h-4 w-4" /> Withdraw</button>
        </div>
      </div>
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><PlayCircle className="h-5 w-5 text-yellow-400" /> G-Rewards</h3>
      <div className="space-y-3 mb-8">
        {ads.map((ad) => (
          <button key={ad.id} onClick={() => onWatchAd(ad)} className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-yellow-500/20 text-yellow-400"><PlayCircle className="h-5 w-5" /></div>
              <div className="text-left"><p className="font-bold text-white text-sm">{ad.title}</p><p className="text-xs text-gray-400">Watch 3s to earn</p></div>
            </div>
            <span className="font-bold text-yellow-400">+${(ad.reward_amount / 100).toFixed(2)}</span>
          </button>
        ))}
      </div>
      <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
      <div className="space-y-2">
        {transactions.map((tx) => {
          const isSent = tx.sender_id === userId;
          return (
            <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
              <div>
                <p className="text-sm font-medium">{isSent ? "Sent" : "Received"}</p>
                <p className="text-xs text-gray-400">{format(new Date(tx.created_at), "MMM d")}</p>
              </div>
              <span className={`font-bold ${isSent ? 'text-red-400' : 'text-emerald-400'}`}>{isSent ? '-' : '+'}${(tx.amount / 100).toFixed(2)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}