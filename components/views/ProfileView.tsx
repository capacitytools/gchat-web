"use client";

import { Edit3, Eye, MessageSquare, Send, Mail, PhoneCall, MapPin, Instagram, Twitter, Globe, Award, BarChart3, Settings, User } from "lucide-react";

type View = "home" | "list" | "conversation" | "wallet" | "feed" | "gtribe" | "gchatone" | "profile" | "edit-profile" | "analytics" | "settings";
type UserProfile = { id: string; user_id: string; username: string; display_name: string; bio: string; email: string; phone: string; whatsapp: string; address: string; avatar_url: string | null; cover_url: string | null; instagram: string; twitter: string; website: string; profile_views: number; posts_count: number; messages_sent: number; badges: string[]; created_at: string; };

interface ProfileViewProps {
  profile: UserProfile;
  setView: (view: View) => void;
  onEdit: () => void;
}

export function ProfileView({ profile, setView, onEdit }: ProfileViewProps) {
  return (
    <div className="relative z-10 flex flex-col min-h-screen pb-24">
      <header className="sticky top-0 z-20 bg-[#020617]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">My Profile</h1>
        <button onClick={onEdit} className="p-2 rounded-full bg-emerald-500/20 text-emerald-400"><Edit3 className="h-5 w-5" /></button>
      </header>
      <div className="flex-1 overflow-y-auto">
        <div className="relative h-48 bg-gradient-to-r from-cyan-600 to-purple-700">
          {profile.cover_url && <img src={profile.cover_url} className="w-full h-full object-cover" />}
        </div>
        <div className="relative px-6 pb-6">
          <div className="absolute -top-16 left-6">
            <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur border-4 border-[#020617] flex items-center justify-center overflow-hidden">
              {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <User className="h-16 w-16" />}
            </div>
          </div>
          <div className="mt-20">
            <h2 className="text-2xl font-bold">{profile.display_name || "User"}</h2>
            <p className="text-sm text-cyan-400">@{profile.username || "username"}</p>
            {profile.badges && profile.badges.length > 0 && (
              <div className="flex gap-2 mt-2">
                {profile.badges.map((badge, i) => <span key={i} className="px-2 py-1 rounded-full bg-white/20 text-xs flex items-center gap-1"><Award className="h-3 w-3" />{badge}</span>)}
              </div>
            )}
            <p className="text-sm mt-3 text-gray-300">{profile.bio || "No bio yet"}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
              <Eye className="h-5 w-5 text-cyan-400 mx-auto mb-1" />
              <p className="text-lg font-bold">{profile.profile_views || 0}</p>
              <p className="text-xs text-gray-400">Views</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
              <MessageSquare className="h-5 w-5 text-purple-400 mx-auto mb-1" />
              <p className="text-lg font-bold">{profile.posts_count || 0}</p>
              <p className="text-xs text-gray-400">Posts</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
              <Send className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-lg font-bold">{profile.messages_sent || 0}</p>
              <p className="text-xs text-gray-400">Messages</p>
            </div>
          </div>
          <div className="space-y-3 mt-6">
            <h3 className="text-lg font-bold mb-2">Contact Details</h3>
            {profile.email && <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"><Mail className="h-5 w-5 text-blue-400" /><div><p className="text-xs text-gray-400">Email</p><p className="text-sm">{profile.email}</p></div></div>}
            {profile.phone && <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"><PhoneCall className="h-5 w-5 text-green-400" /><div><p className="text-xs text-gray-400">Phone</p><p className="text-sm">{profile.phone}</p></div></div>}
            {profile.whatsapp && <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"><PhoneCall className="h-5 w-5 text-emerald-400" /><div><p className="text-xs text-gray-400">WhatsApp</p><p className="text-sm">{profile.whatsapp}</p></div></div>}
            {profile.address && <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"><MapPin className="h-5 w-5 text-red-400" /><div><p className="text-xs text-gray-400">Address</p><p className="text-sm">{profile.address}</p></div></div>}
          </div>
          {(profile.instagram || profile.twitter || profile.website) && (
            <div className="space-y-3 mt-6">
              <h3 className="text-lg font-bold mb-2">Social Links</h3>
              {profile.instagram && <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"><Instagram className="h-5 w-5 text-pink-400" /><p className="text-sm">{profile.instagram}</p></div>}
              {profile.twitter && <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"><Twitter className="h-5 w-5 text-blue-400" /><p className="text-sm">{profile.twitter}</p></div>}
              {profile.website && <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"><Globe className="h-5 w-5 text-cyan-400" /><p className="text-sm">{profile.website}</p></div>}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button onClick={() => setView("analytics")} className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-left">
              <BarChart3 className="h-6 w-6 text-purple-400 mb-2" />
              <p className="font-bold text-sm">Analytics</p>
              <p className="text-xs text-gray-400">View your stats</p>
            </button>
            <button onClick={() => setView("settings")} className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-left">
              <Settings className="h-6 w-6 text-cyan-400 mb-2" />
              <p className="font-bold text-sm">Settings</p>
              <p className="text-xs text-gray-400">Privacy & more</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}