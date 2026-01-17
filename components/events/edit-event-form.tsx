"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BuildingInput } from "@/components/ui/building-input";
import { ArrowLeft } from "lucide-react";
import { Event } from "@/lib/types/database";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const COMMON_TAGS = [
  "🏀 sports",
  "🎲 board games",
  "📚 study",
  "🍔 food",
  "🌳 outdoor",
  "🎮 gaming",
  "🎵 music",
  "🎨 art",
  "🎉 watch party",
];

interface EditEventFormProps {
  event: Event & {
    host: {
      id: string;
      email: string;
      full_name: string | null;
      avatar_url: string | null;
    };
  };
}

export function EditEventForm({ event: initialEvent }: EditEventFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialEvent.title,
    description: initialEvent.description || "",
    date_time: initialEvent.date_time 
      ? dayjs.utc(initialEvent.date_time).tz("America/New_York").format("YYYY-MM-DDTHH:mm")
      : "",
    end_time: initialEvent.end_time
      ? dayjs.utc(initialEvent.end_time).tz("America/New_York").format("HH:mm")
      : "",
    location: initialEvent.location || "",
    location_building: initialEvent.location_building || "",
    organization: initialEvent.organization || "",
    tags: initialEvent.tags || [],
    visibility: initialEvent.visibility,
  });
  
  // Helper function to generate 25live booking URL for location
  const get25LiveUrl = (building: string, location: string): string => {
    const fullLocation = building ? `${building} ${location}`.trim() : location.trim();
    if (!fullLocation) return '';
    const encodedLocation = encodeURIComponent(fullLocation);
    return `https://25live.collegenet.com/pro/cmu#!/home/search/location/list/&name=${encodedLocation}`;
  };

  const handleTagToggle = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  // Helper function to combine date and time, converting from Eastern to UTC
  const combineDateTime = (dateString: string, timeString: string): string => {
    if (!dateString || !timeString) return '';
    // Combine date and time in Eastern timezone, then convert to UTC
    return dayjs.tz(`${dateString.split('T')[0]} ${timeString}`, "America/New_York").utc().toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate that start and end times are on the same date (in Eastern timezone)
      if (formData.date_time && formData.end_time) {
        const startDateTime = dayjs.tz(formData.date_time, "America/New_York");
        const endDateTime = dayjs.tz(`${formData.date_time.split('T')[0]} ${formData.end_time}`, "America/New_York");

        // Check if they're on the same date
        if (!startDateTime.isSame(endDateTime, 'day')) {
          throw new Error('Start and end times must be on the same date');
        }

        // Check that end time is after start time
        if (!endDateTime.isAfter(startDateTime)) {
          throw new Error('End time must be after start time');
        }
      }

      const { error } = await supabase
        .from('events')
        .update({
          title: formData.title,
          description: formData.description || null,
          date_time: formData.date_time
            ? dayjs.tz(formData.date_time, "America/New_York").utc().toISOString()
            : null,
          end_time: formData.date_time && formData.end_time
            ? combineDateTime(formData.date_time, formData.end_time)
            : null,
          location: formData.location || null,
          location_building: formData.location_building || null,
          organization: formData.organization || null,
          tags: formData.tags.length > 0 ? formData.tags : null,
          visibility: formData.visibility,
        })
        .eq('id', initialEvent.id);

      if (error) throw error;

      router.push(`/${initialEvent.id}`);
    } catch (error) {
      console.error('Error updating event:', error);
      alert(error instanceof Error ? error.message : 'Failed to update event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild className="w-8">
          <a href={`/${initialEvent.id}`}>
            <ArrowLeft />
          </a>
        </Button>
        <h1 className="text-3xl font-bold">Edit Event</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>
            Update your event information below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Niners vs Steelers Watch Party"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="What's this event about?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_time">Start Date & Time *</Label>
                <Input
                  id="date_time"
                  type="datetime-local"
                  value={formData.date_time}
                  onChange={(e) => setFormData({ ...formData, date_time: e.target.value })}
                  step="900"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time *</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  step="60"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <BuildingInput
                selectedBuilding={formData.location_building}
                locationDetails={formData.location}
                onBuildingChange={(building) => setFormData({ ...formData, location_building: building })}
                onLocationChange={(location) => setFormData({ ...formData, location })}
              />
              {(formData.location_building || formData.location) && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Note:</span> It&apos;s your responsibility as the host to book any relevant rooms on{" "}
                  <a
                    href={get25LiveUrl(formData.location_building, formData.location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    CMU&apos;s 25Live service
                  </a>{" "}
                  to avoid scheduling conflicts.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                placeholder="e.g., Student Government, Sports Club, etc."
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {COMMON_TAGS.map((tag) => (
                  <Button
                    key={tag}
                    type="button"
                    variant={formData.tags.includes(tag) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Visibility</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.visibility === "public" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData({ ...formData, visibility: "public" })}
                >
                  Public (All CMU)
                </Button>
                <Button
                  type="button"
                  variant={formData.visibility === "private" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData({ ...formData, visibility: "private" })}
                >
                  Private Link
                </Button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/${initialEvent.id}`)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!formData.title || !formData.date_time || !formData.end_time || isLoading}
                className="flex-1"
              >
                {isLoading ? "Updating..." : "Update Event"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
