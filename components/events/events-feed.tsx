"use client";

import { useState } from "react";
import { EventWithHost } from "@/lib/types/database";
import { EventCard } from "./event-card";
import { EventFilter, FilterType } from "./event-filter";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { AdvancedFilter } from "./advanced-filter";

interface EventsFeedProps {
  initialEvents: EventWithHost[];
  userId?: string;
}

export function EventsFeed({ initialEvents, userId }: EventsFeedProps) {
  const [events, setEvents] = useState(initialEvents);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<{startHour: number, endHour: number} | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const router = useRouter();
  const supabase = createClient();

  // Extract all unique tags from events
  const availableTags = Array.from(
    new Set(
      events.flatMap(event => event.tags || [])
    )
  ).sort();

  // Helper function to check if event falls within date and time range filters
  const isInTimeWindow = (event: EventWithHost, dateFilter?: string, timeRange?: {startHour: number, endHour: number}): boolean => {
    // If no filters are applied, show all events
    if (!dateFilter && !timeRange) return true;

    // Check date filter
    if (dateFilter && event.date_time) {
      const eventDate = new Date(event.date_time).toISOString().split('T')[0]; // Get YYYY-MM-DD format
      if (eventDate !== dateFilter) return false;
    } else if (dateFilter) {
      // If date filter is set but event has no date, exclude it
      return false;
    }

    // Check time range filter
    if (timeRange && event.date_time) {
      const eventStart = new Date(event.date_time);
      const eventStartHour = eventStart.getHours();

      // If event has no end time, check if start time is within range
      if (!event.end_time) {
        return eventStartHour >= timeRange.startHour && eventStartHour < timeRange.endHour;
      }

      // If event has end time, check for any overlap with the time window
      const eventEnd = new Date(event.end_time);
      const eventEndHour = eventEnd.getHours();

      // Event overlaps with window if: event starts before window ends AND event ends after window starts
      return eventStartHour < timeRange.endHour && eventEndHour > timeRange.startHour;
    }

    return true;
  };

  const filteredEvents = events
    .filter(event => {
      // Filter by status
      if (activeFilter !== 'all' && event.status !== activeFilter) {
        return false;
      }
      
      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = event.title?.toLowerCase().includes(query);
        const matchesDescription = event.description?.toLowerCase().includes(query);
        const matchesLocation = event.location?.toLowerCase().includes(query);
        
        if (!matchesTitle && !matchesDescription && !matchesLocation) {
          return false;
        }
      }
      
      // Filter by tags
      if (selectedTags.length > 0) {
        const eventTags = event.tags || [];
        const hasMatchingTag = selectedTags.some(tag => eventTags.includes(tag));
        if (!hasMatchingTag) {
          return false;
        }
      }
      
      // Filter by date and time range
      if (!isInTimeWindow(event, selectedDate, selectedTimeRange)) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by date_time (upcoming events first, then by date)
      if (!a.date_time && !b.date_time) return 0;
      if (!a.date_time) return 1;
      if (!b.date_time) return -1;
      
      const dateA = new Date(a.date_time).getTime();
      const dateB = new Date(b.date_time).getTime();
      
      return dateA - dateB;
    });

  const handleInterestToggle = async (eventId: string, isInterested: boolean) => {
    // Redirect to login if not authenticated
    if (!userId) {
      router.push('/auth/login');
      return;
    }

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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold">What&apos;s happening on campus?</h1>
          <div className="flex gap-2">
            <EventFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} />
            <AdvancedFilter
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              availableTags={availableTags}
              selectedTimeRange={selectedTimeRange}
              onTimeRangeChange={setSelectedTimeRange}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search events by title, description, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
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
              isLoggedIn={!!userId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
