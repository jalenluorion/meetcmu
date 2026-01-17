import { createClient } from "@/lib/supabase/server";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import { EnvVarWarning } from "@/components/env-var-warning";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EventsFeed } from "@/components/events/events-feed";
import { Plus } from "lucide-react";
import {
  SignedIn,
} from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'

export default async function HomePage() {
  const supabase = await createClient();
  const user = await currentUser();

  // Fetch all events with host information and counts, sorted by date_time
  const { data: events, error } = await supabase
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
    .eq('visibility', 'public')
    .gte('date_time', new Date().toISOString())
    .order('date_time', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('Error fetching events:', error);
    return <div>Error loading events</div>;
  }

  // Fetch prospect counts
  const { data: prospectCounts } = await supabase
    .from('event_prospects')
    .select('event_id, user_id');

  // Fetch attendee counts
  const { data: attendeeCounts } = await supabase
    .from('event_attendees')
    .select('event_id, user_id');

  // Combine the data
  const eventsWithDetails = events?.map(event => {
    const prospects = prospectCounts?.filter(p => p.event_id === event.id) || [];
    const attendees = attendeeCounts?.filter(a => a.event_id === event.id) || [];
    
    return {
      ...event,
      prospect_count: prospects.length,
      attendee_count: attendees.length,
      user_is_prospect: user ? prospects.some(p => p.user_id === user.id) : false,
      user_is_attendee: user ? attendees.some(a => a.user_id === user.id) : false,
    };
  }) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="w-full border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-5xl mx-auto flex justify-between items-center p-3 px-5">
          <Link href="/" className="font-bold text-xl">
            MeetCMU
          </Link>
          <div className="flex gap-3 items-center">
            <SignedIn>
              <Button asChild size="sm">
                <Link href="/new">
                  <Plus className="h-4 w-4 mr-1" />
                  New Event
                </Link>
              </Button>
            </SignedIn>
            <div className="flex gap-3 items-center">
              {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 w-full max-w-5xl mx-auto p-5">
        <EventsFeed initialEvents={eventsWithDetails} userId={user?.id} />
      </main>
    </div>
  );
}
