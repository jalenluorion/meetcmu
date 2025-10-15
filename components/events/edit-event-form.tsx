"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Event } from "@/lib/types/database";

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
    date_time: initialEvent.date_time ? new Date(initialEvent.date_time).toISOString().slice(0, 16) : "",
    end_time: initialEvent.end_time ? new Date(initialEvent.end_time).toISOString().slice(0, 16) : "",
    location: initialEvent.location || "",
    tags: initialEvent.tags || [],
    visibility: initialEvent.visibility,
  });

  const handleTagToggle = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('events')
        .update({
          title: formData.title,
          description: formData.description || null,
          date_time: formData.date_time || null,
          end_time: formData.end_time || null,
          location: formData.location || null,
          tags: formData.tags.length > 0 ? formData.tags : null,
          visibility: formData.visibility,
        })
        .eq('id', initialEvent.id);

      if (error) throw error;

      router.push(`/${initialEvent.id}`);
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event. Please try again.');
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
                placeholder="e.g., Pickup Basketball at Gesling"
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
                <Label htmlFor="date_time">Start Time *</Label>
                <Input
                  id="date_time"
                  type="datetime-local"
                  value={formData.date_time}
                  onChange={(e) => setFormData({ ...formData, date_time: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time *</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Gesling Stadium"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
