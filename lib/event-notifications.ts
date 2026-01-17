// Helper functions to trigger notifications when events are updated
import { createClient } from "@/lib/supabase/client";
import { notifyEventOfficial, notifyEventTimeChanged, notifyEventCancelled } from "./notifications";

// Call this when an event changes from tentative to official
export async function handleEventBecameOfficial(eventId: string, eventTitle: string) {
  const supabase = createClient();
  
  try {
    // Get all prospects who were interested
    const { data: prospects } = await supabase
      .from('event_prospects')
      .select('user_id')
      .eq('event_id', eventId);

    if (prospects && prospects.length > 0) {
      const prospectIds = prospects.map(p => p.user_id);
      
      // Notify all prospects
      await notifyEventOfficial(eventId, eventTitle, prospectIds);
      
      // Automatically convert prospects to attendees
      const { data: event } = await supabase
        .from('events')
        .select('host_id')
        .eq('id', eventId)
        .single();

      for (const prospect of prospects) {
        // Add as attendee
        await supabase
          .from('event_attendees')
          .insert({ event_id: eventId, user_id: prospect.user_id });
      }

      // Remove all prospects
      await supabase
        .from('event_prospects')
        .delete()
        .eq('event_id', eventId);
    }
  } catch (error) {
    console.error('Error handling event became official:', error);
  }
}

// Call this when an event's date/time changes
export async function handleEventTimeChanged(
  eventId: string,
  eventTitle: string,
  newDateTime: string,
  status: 'tentative' | 'official'
) {
  const supabase = createClient();
  
  try {
    let interestedUserIds: string[] = [];

    if (status === 'tentative') {
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

    if (interestedUserIds.length > 0) {
      await notifyEventTimeChanged(eventId, eventTitle, newDateTime, interestedUserIds);
    }
  } catch (error) {
    console.error('Error handling event time changed:', error);
  }
}

// Call this when an event is cancelled
export async function handleEventCancelled(
  eventId: string,
  eventTitle: string,
  status: 'tentative' | 'official'
) {
  const supabase = createClient();
  
  try {
    let interestedUserIds: string[] = [];

    if (status === 'tentative') {
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

    if (interestedUserIds.length > 0) {
      await notifyEventCancelled(eventId, eventTitle, interestedUserIds);
    }
  } catch (error) {
    console.error('Error handling event cancelled:', error);
  }
}
