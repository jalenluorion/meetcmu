import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { notifyEventStartingSoon, notifyEventStartingNow } from "@/lib/notifications";

// This endpoint should be called by a cron job every 5 minutes
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  // Verify this is being called by a cron job (optional: add auth token)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    // Find events starting in ~1 hour (between 55-65 minutes from now)
    const fiftyFiveMinutesFromNow = new Date(now.getTime() + 55 * 60 * 1000);
    const sixtyFiveMinutesFromNow = new Date(now.getTime() + 65 * 60 * 1000);

    const { data: soonEvents } = await supabase
      .from('events')
      .select('id, title, date_time, status')
      .eq('status', 'official')
      .gte('date_time', fiftyFiveMinutesFromNow.toISOString())
      .lte('date_time', sixtyFiveMinutesFromNow.toISOString());

    // Find events starting now (within next 5 minutes)
    const { data: nowEvents } = await supabase
      .from('events')
      .select('id, title, date_time, status')
      .eq('status', 'official')
      .gte('date_time', now.toISOString())
      .lte('date_time', fiveMinutesFromNow.toISOString());

    let soonNotificationsSent = 0;
    let nowNotificationsSent = 0;

    // Send "starting soon" notifications
    if (soonEvents && soonEvents.length > 0) {
      for (const event of soonEvents) {
        // Get all attendees
        const { data: attendees } = await supabase
          .from('event_attendees')
          .select('user_id')
          .eq('event_id', event.id);

        if (attendees && attendees.length > 0) {
          const attendeeIds = attendees.map(a => a.user_id);
          await notifyEventStartingSoon(event.id, event.title, attendeeIds);
          soonNotificationsSent += attendeeIds.length;
        }
      }
    }

    // Send "starting now" notifications
    if (nowEvents && nowEvents.length > 0) {
      for (const event of nowEvents) {
        // Get all attendees
        const { data: attendees } = await supabase
          .from('event_attendees')
          .select('user_id')
          .eq('event_id', event.id);

        if (attendees && attendees.length > 0) {
          const attendeeIds = attendees.map(a => a.user_id);
          await notifyEventStartingNow(event.id, event.title, attendeeIds);
          nowNotificationsSent += attendeeIds.length;
        }
      }
    }

    return NextResponse.json({
      success: true,
      soonEvents: soonEvents?.length || 0,
      nowEvents: nowEvents?.length || 0,
      soonNotificationsSent,
      nowNotificationsSent,
    });
  } catch (error) {
    console.error('Error checking events for notifications:', error);
    return NextResponse.json({ error: 'Error processing notifications' }, { status: 500 });
  }
}
