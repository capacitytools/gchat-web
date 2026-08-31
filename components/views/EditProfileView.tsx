"use client";

import { ArrowLeft, Save, Camera } from "lucide-react";

type View = "home" | "list" | "conversation" | "wallet" | "feed" | "gtribe" | "gchatone" | "profile" | "edit-profile" | "analytics" | "settings";

interface EditProfileViewProps {
  setView: (view: View) => void;
  editForm: {
    display_name: string; username: string; bio: string; email: string; phone: string;
    whatsapp: string; address: string; instagram: string; twitter: string; website: string;
  };
  setEditForm: (form: any) => void;
  avatarPreview: string | null;
  coverPreview: string | null;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCoverChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
}

export function EditProfileView({ setView, editForm, setEditForm, avatarPreview, coverPreview, onAvatarChange, onCoverChange, onSave }: EditProfileViewProps) {
  return (
    <div className="relative z-10 flex flex-col min-h-screen pb-24">
      <header className="sticky top-0 z-20 bg-[#020617]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setView("profile")} className="p-2 rounded-full bg-white/5"><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-xl font-bold">Edit Profile</h1>
        <button onClick={onSave} className="p-2 rounded-full bg-emerald-500/20 text-emerald-400"><Save className="h-5 w-5" /></button>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Cover Image</label>
          <div className="relative h-32 rounded-xl bg-white/5 border-2 border-dashed border-white/30 flex items-center justify-center overflow-hidden">
            {coverPreview ? <img src={coverPreview} className="w-full h-full object-cover" /> : <Camera className="h-8 w-8 text-gray-400" />}
          </div>
          <button onClick={() => document.getElementById('cover-input')?.click()} className="text-sm text-cyan-400 mt-2">Change Cover</button>
          <input id="cover-input" type="file" accept="image/*" className="hidden" onChange={onCoverChange} />
        </div>
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-dashed border-white/30 mx-auto mb-2 flex items-center justify-center overflow-hidden">
            {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" /> : <Camera className="h-8 w-8 text-gray-400" />}
          </div>
          <button onClick={() => document.getElementById('avatar-input')?.click()} className="text-sm text-cyan-400">Change Avatar</button>
          <input id="avatar-input" type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
        </div>
        {[
          { key: "display_name", label: "Display Name", type: "input" },
          { key: "username", label: "Username", type: "input" },
          { key: "bio", label: "Bio", type: "textarea" },
          { key: "email", label: "Email", type: "input" },
          { key: "phone", label: "Phone Number", type: "input" },
          { key: "whatsapp", label: "WhatsApp Number", type: "input" },
          { key: "address", label: "Address", type: "input" },
          { key: "instagram", label: "Instagram", type: "input" },
          { key: "twitter", label: "Twitter/X", type: "input" },
          { key: "website", label: "Website", type: "input" },
        ].map((field) => (
          <div key={field.key}>
            <label className="text-xs text-gray-400 mb-1 block">{field.label}</label>
            {field.type === "textarea" ? (
              <textarea value={(editForm as any)[field.key]} onChange={(e) => setEditForm({...editForm, [field.key]: e.target.value})} className="w-full h-20 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white resize-none" />
            ) : (
              <input value={(editForm as any)[field.key]} onChange={(e) => setEditForm({...editForm, [field.key]: e.target.value})} className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white" />
            )}
          </div>
        ))}
        <button onClick={onSave} className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 font-bold">Save Profile</button>
      </div>
    </div>
  );
}