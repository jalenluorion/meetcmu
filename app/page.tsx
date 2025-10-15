import { createClient } from "@/lib/supabase/server";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import { EnvVarWarning } from "@/components/env-var-warning";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EventsFeed } from "@/components/events/events-feed";
import { Plus } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If not authenticated, show landing page
  if (!user) {
    return (
      <main className="min-h-screen flex flex-col">
        <nav className="w-full border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl mx-auto flex justify-between items-center p-3 px-5">
            <div className="flex gap-5 items-center font-semibold">
              <Link href="/">MeetCMU</Link>
            </div>
            <div className="flex items-center gap-3">
              {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
              <ThemeSwitcher />
            </div>
          </div>
        </nav>

        <div className="flex-1 flex flex-col items-center justify-center p-5 text-center">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-5xl font-bold">Welcome to MeetCMU</h1>
            <p className="text-xl text-muted-foreground">
              Propose, discover, and join casual events with CMU students.
              Gauge interest before making events official.
            </p>
            <div className="flex gap-4 justify-center mt-8">
              <Button asChild size="lg">
                <Link href="/auth/login">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>

        <footer className="w-full border-t py-8 text-center text-sm text-muted-foreground">
          <p>Built for CMU students by CMU students</p>
        </footer>
      </main>
    );
  }

  // User is authenticated, show events feed
  // Fetch all events with host information and counts
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
    .order('created_at', { ascending: false });

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
      user_is_prospect: prospects.some(p => p.user_id === user.id),
      user_is_attendee: attendees.some(a => a.user_id === user.id),
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
            <Button asChild size="sm">
              <Link href="/new">
                <Plus className="h-4 w-4 mr-1" />
                New Event
              </Link>
            </Button>
            <AuthButton />
            <ThemeSwitcher />
          </div>
        </div>
      </nav>
      <main className="flex-1 w-full max-w-5xl mx-auto p-5">
        <EventsFeed initialEvents={eventsWithDetails} userId={user.id} />
      </main>
    </div>
  );
}
