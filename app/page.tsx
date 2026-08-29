import { createClient } from "@/utils/supabase/server";
import { GChatApp } from "@/components/gchat-app";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect("/auth");
  }

  return (
    <main>
      <GChatApp />
    </main>
  );
}