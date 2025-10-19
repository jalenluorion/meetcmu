import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { EditEventForm } from "@/components/events/edit-event-form";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Require authentication for editing
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Fetch event
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !event) {
    notFound();
  }

  // Verify user is the host
  if (event.host_id !== user.id) {
    redirect(`/${id}`);
  }

  return <EditEventForm event={event} />;
}
