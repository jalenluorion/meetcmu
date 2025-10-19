"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EventWithDetails } from "@/lib/types/database";
import { StatusBadge } from "./status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Users, Trash2, Edit } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface EventDetailClientProps {
  event: EventWithDetails;
  userId?: string;
}

export function EventDetailClient({ event: initialEvent, userId }: EventDetailClientProps) {
  const [event, setEvent] = useState(initialEvent);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const isLoggedIn = !!userId;
  const isHost = userId ? event.host_id === userId : false;
  const isInterested = event.user_is_prospect || event.user_is_attendee;

  const formatDateTime = (startTime: string | null, endTime: string | null) => {
    if (!startTime) return "Date TBD";
    
    const start = new Date(startTime);
    const dateStr = start.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    
    const startTimeStr = start.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    
    if (!endTime) return `${dateStr} at ${startTimeStr}`;
    
    const end = new Date(endTime);
    const endTimeStr = end.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    
    return `${dateStr}, ${startTimeStr} - ${endTimeStr}`;
  };

  const handleInterestToggle = async () => {
    // Redirect to login if not authenticated
    if (!userId) {
      router.push('/auth/login');
      return;
    }

    setIsLoading(true);
    try {
      if (event.status === 'tentative') {
        if (isInterested) {
          await supabase
            .from('event_prospects')
            .delete()
            .eq('event_id', event.id)
            .eq('user_id', userId);
          
          setEvent({
            ...event,
            user_is_prospect: false,
            prospect_count: Math.max(0, event.prospect_count - 1),
            prospects: event.prospects.filter(p => p.id !== userId),
          });
        } else {
          await supabase
            .from('event_prospects')
            .insert({ event_id: event.id, user_id: userId });
          
          router.refresh();
        }
      } else {
        if (isInterested) {
          await supabase
            .from('event_attendees')
            .delete()
            .eq('event_id', event.id)
            .eq('user_id', userId);
          
          setEvent({
            ...event,
            user_is_attendee: false,
            attendee_count: Math.max(0, event.attendee_count - 1),
            attendees: event.attendees.filter(a => a.id !== userId),
          });
        } else {
          await supabase
            .from('event_attendees')
            .insert({ event_id: event.id, user_id: userId });
          
          router.refresh();
        }
      }
    } catch (error) {
      console.error('Error toggling interest:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertToOfficial = async () => {
    if (!confirm('Convert this event to official? All prospects will be notified.')) {
      return;
    }

    setIsLoading(true);
    try {
      // Update event status
      const { error } = await supabase
        .from('events')
        .update({ status: 'official' })
        .eq('id', event.id);

      if (error) throw error;

      // Convert all prospects to attendees
      if (event.prospects.length > 0) {
        const attendeesToInsert = event.prospects.map(prospect => ({
          event_id: event.id,
          user_id: prospect.id,
        }));

        const { error: attendeesError } = await supabase
          .from('event_attendees')
          .insert(attendeesToInsert);

        if (attendeesError) {
          console.error('Error converting prospects to attendees:', attendeesError);
          // Don't throw error - event was converted successfully, just attendee conversion failed
        }

        // Delete all prospects for this event
        const { error: prospectsError } = await supabase
          .from('event_prospects')
          .delete()
          .eq('event_id', event.id);

        if (prospectsError) {
          console.error('Error deleting prospects:', prospectsError);
          // Don't throw error - prospects were converted successfully, just deletion failed
        }
      }

      // Create notifications for all prospects
      const notifications = event.prospects.map(prospect => ({
        user_id: prospect.id,
        event_id: event.id,
        type: 'event_official' as const,
        message: `"${event.title}" is now official!`,
      }));

      if (notifications.length > 0) {
        await supabase.from('notifications').insert(notifications);
      }

      // Update local state to reflect changes immediately
      setEvent({
        ...event,
        status: 'official',
        prospects: [],
        prospect_count: 0,
        attendees: [...event.attendees, ...event.prospects],
        attendee_count: event.attendee_count + event.prospect_count,
      });

      router.refresh();
    } catch (error) {
      console.error('Error converting event:', error);
      alert('Failed to convert event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!confirm('Are you sure you want to delete this event? This cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);

      if (error) throw error;

      router.push('/');
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-3xl">{event.title}</CardTitle>
                <StatusBadge status={event.status} />
              </div>
              <CardDescription>
                Hosted by {event.host.full_name || event.host.email}
              </CardDescription>
            </div>
            {isHost && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={`/${event.id}/edit`}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </a>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteEvent}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {event.description && (
            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-muted-foreground">{event.description}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-5 w-5" />
              <span>{formatDateTime(event.date_time, event.end_time)}</span>
            </div>
            
            {event.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5" />
                <span>{event.location}</span>
              </div>
            )}
          </div>

          {event.tags && event.tags.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <span 
                    key={tag} 
                    className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!isHost && (
            <Button
              className="w-full"
              onClick={handleInterestToggle}
              disabled={isLoading}
              variant={isInterested ? "outline" : "default"}
            >
              {!isLoggedIn
                ? "Log in to Join"
                : event.status === 'tentative' 
                  ? (isInterested ? "Remove Interest" : "I'm Interested")
                  : (isInterested ? "Leave Event" : "Join Event")
              }
            </Button>
          )}

          {isHost && event.status === 'tentative' && event.prospect_count > 0 && (
            <Button
              className="w-full"
              onClick={handleConvertToOfficial}
              disabled={isLoading}
            >
              🟢 Convert to Official Event ({event.prospect_count} interested)
            </Button>
          )}
        </CardContent>
      </Card>

      {event.status === 'tentative' && event.prospects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Interested ({event.prospect_count})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {event.prospects.map((prospect) => (
                <div key={prospect.id} className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={prospect.avatar_url || undefined} />
                    <AvatarFallback>
                      {getInitials(prospect.full_name, prospect.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{prospect.full_name || prospect.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {event.status === 'official' && event.attendees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Attending ({event.attendee_count})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {event.attendees.map((attendee) => (
                <div key={attendee.id} className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={attendee.avatar_url || undefined} />
                    <AvatarFallback>
                      {getInitials(attendee.full_name, attendee.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{attendee.full_name || attendee.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
