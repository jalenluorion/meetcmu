import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import { ensureUserProfile } from "@/lib/profile";

export default async function ProfilePage() {
  const user = await currentUser();
  if (!user) return null;

  // Ensure profile exists and get it
  const profile = await ensureUserProfile();
  if (!profile) return null;

  const supabase = await createClient();

  // Get hosted events
  const { data: hostedEvents } = await supabase
    .from('events')
    .select('*')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false });

  // Get events user is interested in (prospects)
  const { data: interestedEvents } = await supabase
    .from('event_prospects')
    .select(`
      event_id,
      events(*)
    `)
    .eq('user_id', user.id);

  // Get events user is attending
  const { data: attendingEvents } = await supabase
    .from('event_attendees')
    .select(`
      event_id,
      events(*)
    `)
    .eq('user_id', user.id);

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "America/New_York"
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Profile</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.imageUrl || undefined} />
              <AvatarFallback className="text-2xl">
                {getInitials(user.fullName, user.emailAddresses[0]?.emailAddress || '')}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{user.fullName || user.emailAddresses[0]?.emailAddress}</CardTitle>
              <CardDescription>{user.emailAddresses[0]?.emailAddress}</CardDescription>
            </div>
          </div>
        </CardHeader>
        {profile?.interests && profile.interests.length > 0 && (
          <CardContent>
            <h3 className="font-semibold mb-2">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest: string) => (
                <Badge key={interest} variant="secondary">
                  {interest}
                </Badge>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Events Hosted ({hostedEvents?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!hostedEvents || hostedEvents.length === 0 ? (
            <p className="text-muted-foreground text-sm">No events hosted yet.</p>
          ) : (
            <div className="space-y-3">
              {hostedEvents.map((event) => (
                <a 
                  key={event.id} 
                  href={`/${event.id}`}
                  className="block p-3 rounded-md border hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{event.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(event.created_at)}</span>
                        <Badge 
                          variant="outline" 
                          className={event.status === 'tentative' ? 'border-yellow-500' : 'border-green-500'}
                        >
                          {event.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Interested In ({interestedEvents?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {!interestedEvents || interestedEvents.length === 0 ? (
              <p className="text-muted-foreground text-sm">No tentative events yet.</p>
            ) : (
              <div className="space-y-2">
                {interestedEvents.map((item) => {
                  const event = item.events as unknown as { id: string; title: string };
                  return (
                    <a 
                      key={item.event_id} 
                      href={`/${event.id}`}
                      className="block p-2 rounded-md border hover:bg-accent transition-colors text-sm"
                    >
                      {event.title}
                    </a>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attending ({attendingEvents?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {!attendingEvents || attendingEvents.length === 0 ? (
              <p className="text-muted-foreground text-sm">No official events yet.</p>
            ) : (
              <div className="space-y-2">
                {attendingEvents.map((item) => {
                  const event = item.events as unknown as { id: string; title: string };
                  return (
                    <a 
                      key={item.event_id} 
                      href={`/${event.id}`}
                      className="block p-2 rounded-md border hover:bg-accent transition-colors text-sm"
                    >
                      {event.title}
                    </a>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
