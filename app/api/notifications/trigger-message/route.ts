import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { notifyNewMessage } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();
  const { eventId, senderId } = body;

  if (!eventId || !senderId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // Get event details
    const { data: event } = await supabase
      .from('events')
      .select('title, status')
      .eq('id', eventId)
      .single();

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get sender details
    const { data: sender } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', senderId)
      .single();

    const senderName = sender?.full_name || sender?.email || 'Someone';

    // Get all interested users (prospects or attendees)
    let interestedUserIds: string[] = [];

    if (event.status === 'tentative') {
      const { data: prospects } = await supabase
        .from('event_prospects')
        .select('user_id')
        .eq('event_id', eventId);
      interestedUserIds = prospects?.map(p => p.user_id) || [];
    } else {
      const { data: attendees } = await supabase
        .from('event_attendees')
        .select('user_id')
        .eq('event_id', eventId);
      interestedUserIds = attendees?.map(a => a.user_id) || [];
    }

    // Add host to the list
    const { data: eventHost } = await supabase
      .from('events')
      .select('host_id')
      .eq('id', eventId)
      .single();

    if (eventHost?.host_id && !interestedUserIds.includes(eventHost.host_id)) {
      interestedUserIds.push(eventHost.host_id);
    }

    // Send notifications
    await notifyNewMessage(eventId, senderId, senderName, event.title, interestedUserIds);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error triggering message notification:', error);
    return NextResponse.json({ error: 'Error sending notifications' }, { status: 500 });
  }
}
