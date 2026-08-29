"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { GChatApp } from "@/components/gchat-app";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { GChatBackground } from "@/components/GChatBackground";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
      } else {
        setUser(session.user);
      }
      setLoading(false);
    };
    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="relative min-h-screen w-full max-w-md mx-auto text-white overflow-hidden">
        <GChatBackground />
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return <GChatApp />;
}