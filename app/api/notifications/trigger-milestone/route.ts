import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { checkAndCreateMilestoneNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();
  const { eventId, currentCount, previousCount } = body;

  if (!eventId || currentCount === undefined || previousCount === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // Get event details
    const { data: event } = await supabase
      .from('events')
      .select('title, status, host_id')
      .eq('id', eventId)
      .single();

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check and create milestone notification
    await checkAndCreateMilestoneNotification(
      eventId,
      event.host_id,
      currentCount,
      previousCount,
      event.title,
      event.status === 'tentative'
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error triggering milestone notification:', error);
    return NextResponse.json({ error: 'Error sending notification' }, { status: 500 });
  }
}
