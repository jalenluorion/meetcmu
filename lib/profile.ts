import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@clerk/nextjs/server";

export async function ensureUserProfile() {
  const user = await currentUser();
  if (!user) return null;

  const supabase = await createClient();

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

export async function getOrCreateUserProfile() {
  return await ensureUserProfile();
}
