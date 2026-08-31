import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { chat_id, message_text, sender_name } = await request.json();

    // Initialize Supabase client with Service Role Key (or Anon Key if RLS allows)
    // For this simple setup, we use the public env vars. 
    // In production, use a Service Role key for backend operations.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 1. Get all members of this chat
    const { data: members } = await supabase
      .from('chat_members')
      .select('user_id')
      .eq('chat_id', chat_id);

    if (!members || members.length === 0) {
      return NextResponse.json({ error: 'No members found' }, { status: 404 });
    }

    const memberIds = members.map((m: any) => m.user_id);

    // 2. Get OneSignal IDs for these members
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('onesignal_id, user_id')
      .in('user_id', memberIds);

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: 'No devices subscribed' }, { status: 200 });
    }

    const playerIds = subscriptions.map((s: any) => s.onesignal_id);

    // 3. Send the notification via OneSignal
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID, // We will add this to Vercel next
        include_player_ids: playerIds,
        headings: { en: sender_name },
        contents: { en: message_text },
        url: '/',
        ios_badgeType: 'Increase',
        ios_badgeCount: 1
      })
    });

    const data = await response.json();
    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}