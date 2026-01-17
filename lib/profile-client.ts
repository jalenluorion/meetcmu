import { createClient } from "@/lib/supabase/client";
import { UserResource } from "@clerk/types";

export async function ensureUserProfileClient(user: UserResource) {
  if (!user) return null;

  const supabase = createClient();

  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (existingProfile) {
    return existingProfile;
  }

  // Create new profile
  const { data: newProfile, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      full_name: user.fullName,
      avatar_url: user.imageUrl,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }

  return newProfile;
}
