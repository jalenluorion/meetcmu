import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { EditEventForm } from "@/components/events/edit-event-form";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  // Fetch event with host
  const { data: event, error } = await supabase
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
    .eq('id', id)
    .single();

  if (error || !event) {
    notFound();
  }

  // Check if current user is the host
  if (event.host_id !== user.id) {
    notFound();
  }

  return (
    <main className="">
    <EditEventForm event={event} />
    </main>
  );
}
