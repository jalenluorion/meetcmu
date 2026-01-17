"use client";

import { EventWithHost } from "@/lib/types/database";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "./status-badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface EventCardProps {
  event: EventWithHost;
  onInterestToggle?: (eventId: string, isInterested: boolean) => Promise<void>;
  isLoggedIn?: boolean;
}

export function EventCard({ event, onInterestToggle, isLoggedIn = true }: EventCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isInterested = event.user_is_prospect || event.user_is_attendee;
  const count = event.status === 'tentative' ? event.prospect_count : event.attendee_count;
  const countLabel = event.status === 'tentative' ? 'Interested' : 'Attending';

  const handleInterestClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onInterestToggle) return;
    
    setIsLoading(true);
    try {
      await onInterestToggle(event.id, !isInterested);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (startTime: string | null, endTime: string | null) => {
    if (!startTime) return "Date TBD";
    
    const start = new Date(startTime);
    const dateStr = start.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: "America/New_York"
    });
    
    const startTimeStr = start.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
    });
    
    if (!endTime) return `${dateStr}, ${startTimeStr}`;
    
    const end = new Date(endTime);
    const endTimeStr = end.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
    });
    
    return `${dateStr}, ${startTimeStr} - ${endTimeStr}`;
  };

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        event.status === 'tentative' ? 'border-dashed opacity-75' : ''
      }`}
      onClick={() => router.push(`/${event.id}`)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl">{event.title}</CardTitle>
          <StatusBadge status={event.status} dateTime={event.date_time} endTime={event.end_time} />
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          Hosted by {event.host.full_name || event.host.email}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {event.description && (
          <p className="text-sm line-clamp-2">{event.description}</p>
        )}
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDateTime(event.date_time, event.end_time)}</span>
          </div>
          
          {(event.location_building || event.location) && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span className="truncate">
                {event.location_building && event.location
                  ? `${event.location_building} ${event.location}`
                  : event.location_building || event.location}
              </span>
            </div>
          )}
        </div>

        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {event.tags.map((tag) => (
              <span 
                key={tag} 
                className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{count} {countLabel}</span>
        </div>
        
        <Button
          variant={isInterested ? "default" : "outline-solid"}
          size="sm"
          onClick={handleInterestClick}
          disabled={isLoading}
        >
          {!isLoggedIn
            ? "Log in to Join"
            : event.status === 'tentative' 
              ? (isInterested ? "Interested ✓" : "I'm Interested")
              : (isInterested ? "Joined ✓" : "Join Event")
          }
        </Button>
      </CardFooter>
    </Card>
  );
}
