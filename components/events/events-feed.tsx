"use client";

import { useState } from "react";
import { EventWithHost } from "@/lib/types/database";
import { EventCard } from "./event-card";
import { EventFilter, FilterType } from "./event-filter";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface EventsFeedProps {
  initialEvents: EventWithHost[];
  userId: string;
}

export function EventsFeed({ initialEvents, userId }: EventsFeedProps) {
  const [events, setEvents] = useState(initialEvents);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const router = useRouter();
  const supabase = createClient();

  const filteredEvents = events.filter(event => {
    if (activeFilter === 'all') return true;
    return event.status === activeFilter;
  });

  const handleInterestToggle = async (eventId: string, isInterested: boolean) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    try {
      if (event.status === 'tentative') {
        // Handle prospects
        if (isInterested) {
          const { error } = await supabase
            .from('event_prospects')
            .insert({ event_id: eventId, user_id: userId });
          
          if (error) throw error;

          // Update local state
          setEvents(events.map(e => 
            e.id === eventId 
              ? { ...e, user_is_prospect: true, prospect_count: e.prospect_count + 1 }
              : e
          ));
        } else {
          const { error } = await supabase
            .from('event_prospects')
            .delete()
            .eq('event_id', eventId)
            .eq('user_id', userId);
          
          if (error) throw error;

          // Update local state
          setEvents(events.map(e => 
            e.id === eventId 
              ? { ...e, user_is_prospect: false, prospect_count: Math.max(0, e.prospect_count - 1) }
              : e
          ));
        }
      } else {
        // Handle attendees for official events
        if (isInterested) {
          const { error } = await supabase
            .from('event_attendees')
            .insert({ event_id: eventId, user_id: userId });
          
          if (error) throw error;

          // Update local state
          setEvents(events.map(e => 
            e.id === eventId 
              ? { ...e, user_is_attendee: true, attendee_count: e.attendee_count + 1 }
              : e
          ));
        } else {
          const { error } = await supabase
            .from('event_attendees')
            .delete()
            .eq('event_id', eventId)
            .eq('user_id', userId);
          
          if (error) throw error;

          // Update local state
          setEvents(events.map(e => 
            e.id === eventId 
              ? { ...e, user_is_attendee: false, attendee_count: Math.max(0, e.attendee_count - 1) }
              : e
          ));
        }
      }

      router.refresh();
    } catch (error) {
      console.error('Error toggling interest:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold">Events Feed</h1>
        <EventFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      </div>

      {filteredEvents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No events found.</p>
          <p className="text-sm mt-2">Be the first to create an event!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredEvents.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              onInterestToggle={handleInterestToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
