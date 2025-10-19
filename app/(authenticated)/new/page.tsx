"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

export default function NewEventPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date_time: "",
    end_time: "",
    location: "",
    tags: [] as string[],
    visibility: "public" as "public" | "private",
  });

  const handleTagToggle = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  // Helper function to generate 25live booking URL for location
  const get25LiveUrl = (location: string): string => {
    if (!location.trim()) return '';
    const encodedLocation = encodeURIComponent(location.trim());
    return `https://25live.collegenet.com/pro/cmu#!/home/search/location/list/&name=${encodedLocation}`;
  };

  // Helper function to round time to nearest 15-minute interval
  const roundTo15Minutes = (timeString: string): string => {
    if (!timeString) return timeString;

    const [hours, minutes] = timeString.split(':').map(Number);
    const roundedMinutes = Math.round(minutes / 15) * 15;

    if (roundedMinutes === 60) {
      return `${(hours + 1) % 24}:${'00'}`;
    }

    return `${hours.toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`;
  };

  // Helper function to combine date and time for end_time
  const combineDateTime = (dateString: string, timeString: string): string => {
    if (!dateString || !timeString) return '';
    return `${dateString.split('T')[0]}T${timeString}:00`;
  };

  const handleSubmit = async (e: React.FormEvent, asTentative: boolean) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Validate that start and end times are on the same date
      if (formData.date_time && formData.end_time) {
        const startDate = new Date(formData.date_time);
        const endDateTime = combineDateTime(formData.date_time, formData.end_time);

        if (!endDateTime) {
          throw new Error('End time is required');
        }

        const endDate = new Date(endDateTime);

        // Check if they're on the same date
        if (startDate.toDateString() !== endDate.toDateString()) {
          throw new Error('Start and end times must be on the same date');
        }

        // Check that end time is after start time
        if (endDate <= startDate) {
          throw new Error('End time must be after start time');
        }
      }

      const { data, error } = await supabase
        .from('events')
        .insert({
          host_id: user.id,
          title: formData.title,
          description: formData.description || null,
          date_time: formData.date_time || null,
          end_time: formData.date_time && formData.end_time ? combineDateTime(formData.date_time, formData.end_time) : null,
          location: formData.location || null,
          tags: formData.tags.length > 0 ? formData.tags : null,
          visibility: formData.visibility,
          status: asTentative ? 'tentative' : 'official',
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-add host as prospect for tentative events or attendee for official events
      if (asTentative) {
        const { error: prospectError } = await supabase
          .from('event_prospects')
          .insert({
            event_id: data.id,
            user_id: user.id,
          });

        if (prospectError) {
          console.error('Error adding host as prospect:', prospectError);
          // Don't throw error - event was created successfully, just prospect addition failed
        }
      } else {
        const { error: attendeeError } = await supabase
          .from('event_attendees')
          .insert({
            event_id: data.id,
            user_id: user.id,
          });

        if (attendeeError) {
          console.error('Error adding host as attendee:', attendeeError);
          // Don't throw error - event was created successfully, just attendee addition failed
        }
      }

      router.push(`/${data.id}`);
    } catch (error) {
      console.error('Error creating event:', error);
      alert(error instanceof Error ? error.message : 'Failed to create event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Create New Event</h1>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>
            Create a tentative event to gauge interest, or post it as official right away.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
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
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                  onChange={(e) => {
                    const roundedTime = roundTo15Minutes(e.target.value);
                    setFormData({ ...formData, end_time: roundedTime });
                  }}
                  step="900"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Margaret Morrison Commons"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
              {formData.location && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Note:</span> It&apos;s your responsibility as the host to book any relevant rooms on{" "}
                  <a
                    href={get25LiveUrl(formData.location)}
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
                onClick={(e) => handleSubmit(e, true)}
                disabled={!formData.title || !formData.date_time || !formData.end_time || isLoading}
                className="flex-1"
              >
                🟡 Post Tentative
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={(e) => handleSubmit(e, false)}
                disabled={!formData.title || !formData.date_time || !formData.end_time || isLoading}
                className="flex-1"
              >
                🟢 Post Official
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
