import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { EventDetailClient } from "@/components/events/event-detail-client";
import { currentUser } from "@clerk/nextjs/server";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user (may be null for logged out users)
  const user = await currentUser();

  // Fetch event with host
  const { data: event, error } = await supabase
    .from('events')
    .select(`
      *,
      host:profiles!events_host_id_fkey(
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('id', id)
    .single();

  if (error || !event) {
    notFound();
  }

  // Fetch prospects with profile data
  const { data: prospects } = await supabase
    .from('event_prospects')
    .select(`
      user_id,
      profiles!event_prospects_user_id_fkey(
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('event_id', id);

  // Fetch attendees with profile data
  const { data: attendees } = await supabase
    .from('event_attendees')
    .select(`
      user_id,
      profiles!event_attendees_user_id_fkey(
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('event_id', id);

  const prospectProfiles = prospects?.map(p => p.profiles).filter(Boolean) || [];
  const attendeeProfiles = attendees?.map(a => a.profiles).filter(Boolean) || [];

  const eventWithDetails = {
    ...event,
    prospects: prospectProfiles,
    attendees: attendeeProfiles,
    prospect_count: prospectProfiles.length,
    attendee_count: attendeeProfiles.length,
    user_is_prospect: user ? (prospects?.some(p => p.user_id === user.id) || false) : false,
    user_is_attendee: user ? (attendees?.some(a => a.user_id === user.id) || false) : false,
  };

  return <EventDetailClient event={eventWithDetails} userId={user?.id} />;
}
