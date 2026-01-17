import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST - Create notification (internal API for server-side notification creation)
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const body = await request.json();
  const { userId, eventId, type, message, link, metadata } = body;

  if (!userId || !type || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      event_id: eventId || null,
      type,
      message,
      link: link || null,
      metadata: metadata || {},
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Error creating notification' }, { status: 500 });
  }

  return NextResponse.json({ notification: data });
}
