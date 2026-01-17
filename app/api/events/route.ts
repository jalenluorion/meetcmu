import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from '@clerk/nextjs/server';

const EVENTS_PER_PAGE = 10;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '0');
  const offset = page * EVENTS_PER_PAGE;
  
  // Get filter parameters
  const activeFilter = searchParams.get('filter') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const selectedTags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
  const selectedBuilding = searchParams.get('building') || '';
  const selectedDate = searchParams.get('date') || '';
  const startHour = searchParams.get('startHour');
  const endHour = searchParams.get('endHour');
  const sortBy = searchParams.get('sortBy') || 'upcoming';

  const supabase = await createClient();
  const user = await currentUser();

  // Build query with filters
  let query = supabase
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
    .gte('date_time', new Date().toISOString());

  // Apply status filter
  if (activeFilter !== 'all') {
    query = query.eq('status', activeFilter);
  }

  // Apply search query
  if (searchQuery.trim()) {
    query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%,location_building.ilike.%${searchQuery}%`);
  }

  // Apply building filter
  if (selectedBuilding) {
    query = query.eq('location_building', selectedBuilding);
  }

  // Apply tags filter (need to fetch all and filter client-side for array contains)
  // Apply date filter
  if (selectedDate) {
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    query = query.gte('date_time', startOfDay.toISOString()).lte('date_time', endOfDay.toISOString());
  }

  // Apply sorting
  if (sortBy === 'upcoming') {
    query = query.order('date_time', { ascending: true, nullsFirst: false });
  }

  // Fetch all matching events first (for tag filtering and popularity sorting)
  const { data: allEvents, error } = await query;

  if (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Error loading events' }, { status: 500 });
  }

  if (!allEvents || allEvents.length === 0) {
    return NextResponse.json({ events: [], hasMore: false });
  }

  // Apply client-side filters that can't be done in SQL
  let filteredEvents = allEvents;

  // Filter by tags (array contains check)
  if (selectedTags.length > 0) {
    filteredEvents = filteredEvents.filter(event => {
      const eventTags = event.tags || [];
      return selectedTags.some(tag => eventTags.includes(tag));
    });
  }

  // Filter by time range
  if (startHour !== null && endHour !== null) {
    const startHourNum = parseInt(startHour);
    const endHourNum = parseInt(endHour);
    
    filteredEvents = filteredEvents.filter(event => {
      if (!event.date_time) return false;
      
      const eventStart = new Date(event.date_time);
      const eventStartHour = parseInt(eventStart.toLocaleTimeString("en-US", {
        hour: "2-digit",
        hour12: false,
        timeZone: "America/New_York",
      }));

      if (!event.end_time) {
        return eventStartHour >= startHourNum && eventStartHour < endHourNum;
      }

      const eventEnd = new Date(event.end_time);
      const eventEndHour = parseInt(eventEnd.toLocaleTimeString("en-US", {
        hour: "2-digit",
        hour12: false,
        timeZone: "America/New_York",
      }));

      return eventStartHour < endHourNum && eventEndHour > startHourNum;
    });
  }

  // Fetch all event IDs for prospect/attendee counts
  const allEventIds = filteredEvents.map(e => e.id);
  
  if (allEventIds.length === 0) {
    return NextResponse.json({ events: [], hasMore: false });
  }

  const { data: prospectCounts } = await supabase
    .from('event_prospects')
    .select('event_id, user_id')
    .in('event_id', allEventIds);

  const { data: attendeeCounts } = await supabase
    .from('event_attendees')
    .select('event_id, user_id')
    .in('event_id', allEventIds);

  // Combine the data with counts
  const eventsWithDetails = filteredEvents.map(event => {
    const prospects = prospectCounts?.filter(p => p.event_id === event.id) || [];
    const attendees = attendeeCounts?.filter(a => a.event_id === event.id) || [];
    
    return {
      ...event,
      prospect_count: prospects.length,
      attendee_count: attendees.length,
      user_is_prospect: user ? prospects.some(p => p.user_id === user.id) : false,
      user_is_attendee: user ? attendees.some(a => a.user_id === user.id) : false,
    };
  });

  // Sort by popularity if needed
  if (sortBy === 'most_popular') {
    eventsWithDetails.sort((a, b) => {
      const countA = a.status === 'tentative' ? a.prospect_count : a.attendee_count;
      const countB = b.status === 'tentative' ? b.prospect_count : b.attendee_count;
      return countB - countA;
    });
  }

  // Apply pagination
  const paginatedEvents = eventsWithDetails.slice(offset, offset + EVENTS_PER_PAGE);

  return NextResponse.json({ 
    events: paginatedEvents,
    hasMore: offset + EVENTS_PER_PAGE < eventsWithDetails.length
  });
}
