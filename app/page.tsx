import { createClient } from "@/utils/supabase/server";
import { GChatApp } from "@/components/gchat-app";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = createClient();

  // CRITICAL FIX: Use getUser() instead of getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  return <GChatApp />;
}