import { createClient } from "@/utils/supabase/server";
import { GChatApp } from "@/components/gchat-app";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = createClient();
  
  const { data: { session }, error } = await supabase.auth.getSession();
  
  console.log("Session check:", session ? "HAS SESSION" : "NO SESSION");
  console.log("Error:", error);
  
  if (!session) {
    redirect("/auth");
  }

  return (
    <main>
      <GChatApp />
    </main>
  );
}