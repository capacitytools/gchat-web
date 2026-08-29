"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Send, Image as ImageIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import imageCompression from "browser-image-compression";

type Message = {
  id: string;
  chat_id: string;
  user_id: string;
  text: string;
  media_url: string | null;
  created_at: string;
  status: "sending" | "sent" | "delivered" | "read";
};

export function ChatWindow({ chatId, currentUserId }: { chatId: string; currentUserId: string }) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, chat_id, user_id, text, media_url, created_at")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (data) {
        const formatted = data.map((msg) => ({ ...msg, status: "delivered" as const }));
        setMessages(formatted);
      }
    };
    fetchMessages();
  }, [chatId, supabase]);

  // 2. Subscribe to realtime messages
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
        (payload) => {
          const newMsg = { ...(payload.new as any), status: "delivered" as const };
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, supabase]);

  // 3. Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Handle Image Selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const localUrl = URL.createObjectURL(file);
      setSelectedImage(localUrl);
    }
  };

  // 5. Send Message (Text + Image)
  const handleSend = async () => {
    if (!text.trim() && !selectedFile) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      chat_id: chatId,
      user_id: currentUserId,
      text: text.trim(),
      media_url: selectedImage,
      created_at: new Date().toISOString(),
      status: "sending",
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setText("");
    setSelectedImage(null);    setIsUploading(!!selectedFile);

    try {
      let finalMediaUrl = null;
      
      if (selectedFile) {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
        const compressedFile = await imageCompression(selectedFile, options);
        const fileExt = compressedFile.name.split(".").pop();
        const fileName = `${currentUserId}/${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("messages")
          .upload(fileName, compressedFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("messages").getPublicUrl(uploadData.path);
        finalMediaUrl = urlData.publicUrl;
      }

      const { data, error } = await supabase
        .from("messages")
        .insert({
          chat_id: chatId,
          user_id: currentUserId,
          text: optimisticMsg.text,
          media_url: finalMediaUrl,
        })
        .select()
        .single();

      if (error) throw error;

      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? { ...msg, id: data.id, status: "sent", media_url: finalMediaUrl } : msg))
      );
    } catch (error) {
      console.error("Failed to send:", error);
      alert("Failed to send. Check your connection or storage bucket.");
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col h-full bg-gbackground dark:bg-gdark-background">
      {/* Messages Area */}      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isOwn = msg.user_id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-gbubble px-4 py-3 shadow-sm ${
                  isOwn ? "bg-ggreen-primary text-white" : "bg-glight-bubble text-gtext dark:bg-gdark-bubble dark:text-gdark-text"
                }`}
              >
                {msg.media_url && (
                  <img src={msg.media_url} alt="Attachment" className="rounded-lg mb-2 max-w-full h-auto" />
                )}
                {msg.text && <p className="whitespace-pre-wrap break-words text-[15px]">{msg.text}</p>}
                <div className={`flex items-center justify-end gap-1 mt-1 text-[11px] ${isOwn ? "text-white/80" : "text-gmuted"}`}>
                  <span>{format(new Date(msg.created_at), "HH:mm")}</span>
                  {isOwn && (
                    <span>
                      {msg.status === "sending" && <Loader2 className="h-3 w-3 animate-spin" />}
                      {msg.status === "sent" && "✓"}
                      {msg.status === "delivered" && "✓✓"}
                      {msg.status === "read" && <span className="text-gblue-primary">✓✓</span>}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview Area */}
      {selectedImage && (
        <div className="px-4 py-2 bg-gbackground dark:bg-gdark-background border-t border-gborder">
          <div className="relative inline-block">
            <img src={selectedImage} alt="Preview" className="h-20 rounded-lg border border-gborder" />
            <button 
              onClick={() => { setSelectedImage(null); setSelectedFile(null); }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Bottom Chat Bar */}
      <div className="border-t border-gborder bg-white dark:border-gdark-border dark:bg-gdark-surface p-3">
        <div className="flex items-end gap-2">          
          {/* 1. THE CAMERA BUTTON - THIS IS WHAT YOU'VE BEEN WAITING FOR! */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-12 w-12 items-center justify-center rounded-full text-gmuted hover:bg-gborder/50 dark:hover:bg-gdark-border/50"
          >
            <ImageIcon className="h-6 w-6" />
          </button>
          
          {/* 2. The Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          
          {/* 3. The Text Box */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Message"
            rows={1}
            className="flex-1 max-h-32 min-h-[48px] resize-none rounded-gbutton border border-gborder bg-gbackground px-4 py-3 text-[15px] outline-none focus:border-ggreen-primary dark:border-gdark-border dark:bg-gdark-background"
          />

          {/* 4. The Send Button */}
          <button
            onClick={handleSend}
            disabled={(!text.trim() && !selectedFile) || isUploading}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-ggreen-primary text-white shadow-lg active:bg-ggreen-deep disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}