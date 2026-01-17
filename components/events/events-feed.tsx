"use client";

import { useState, useCallback, useEffect } from "react";
import { EventWithHost } from "@/lib/types/database";
import { EventCard } from "./event-card";
import { EventFilter, FilterType } from "./event-filter";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { AdvancedFilter, SortBy } from "./advanced-filter";
import InfiniteScroll from "react-infinite-scroll-component";

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
  const [selectedBuilding, setSelectedBuilding] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<SortBy>('upcoming');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialEvents.length === 10);
  const router = useRouter();
  const supabase = createClient();

  // Extract all unique tags from events
  const availableTags = Array.from(
    new Set(
      events.flatMap(event => event.tags || [])
    )
  ).sort();

  // Extract all unique buildings from events
  const availableBuildings = Array.from(
    new Set(
      events
        .map(event => event.location_building)
        .filter((building): building is string => !!building)
    )
  ).sort();

  // Build query params for API
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    if (activeFilter !== 'all') params.set('filter', activeFilter);
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
    if (selectedBuilding) params.set('building', selectedBuilding);
    if (selectedDate) params.set('date', selectedDate);
    if (selectedTimeRange) {
      params.set('startHour', selectedTimeRange.startHour.toString());
      params.set('endHour', selectedTimeRange.endHour.toString());
    }
    if (sortBy) params.set('sortBy', sortBy);
    return params.toString();
  }, [page, activeFilter, searchQuery, selectedTags, selectedBuilding, selectedDate, selectedTimeRange, sortBy]);

  // Reset pagination and fetch new data when filters change
  const resetAndFetch = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('page', '0');
      if (activeFilter !== 'all') params.set('filter', activeFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
      if (selectedBuilding) params.set('building', selectedBuilding);
      if (selectedDate) params.set('date', selectedDate);
      if (selectedTimeRange) {
        params.set('startHour', selectedTimeRange.startHour.toString());
        params.set('endHour', selectedTimeRange.endHour.toString());
      }
      if (sortBy) params.set('sortBy', sortBy);

      const response = await fetch(`/api/events?${params.toString()}`);
      const data = await response.json();
      
      if (data.events) {
        setEvents(data.events);
        setPage(1);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error('Error fetching filtered events:', error);
    }
  }, [activeFilter, searchQuery, selectedTags, selectedBuilding, selectedDate, selectedTimeRange, sortBy]);

  const fetchMoreEvents = useCallback(async () => {
    try {
      const response = await fetch(`/api/events?${buildQueryParams()}`);
      const data = await response.json();
      
      if (data.events && data.events.length > 0) {
        setEvents(prevEvents => [...prevEvents, ...data.events]);
        setPage(prevPage => prevPage + 1);
        setHasMore(data.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching more events:', error);
      setHasMore(false);
    }
  }, [buildQueryParams]);

  // Reset and fetch when filters change
  useEffect(() => {
    resetAndFetch();
  }, [resetAndFetch]);

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
              selectedBuilding={selectedBuilding}
              onBuildingChange={setSelectedBuilding}
              availableBuildings={availableBuildings}
              sortBy={sortBy}
              onSortByChange={setSortBy}
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

      {events.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No upcoming events found.</p>
          <p className="text-sm mt-2">Check back later or be the first to create an event!</p>
        </div>
      ) : (
        <InfiniteScroll
          dataLength={events.length}
          next={fetchMoreEvents}
          hasMore={hasMore}
          loader={
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }
          endMessage={
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">You&apos;ve reached the end of upcoming events!</p>
            </div>
          }
        >
          <div className="grid gap-4">
            {events.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                onInterestToggle={handleInterestToggle}
                isLoggedIn={!!userId}
              />
            ))}
          </div>
        </InfiniteScroll>
      )}
    </div>
  );
}
