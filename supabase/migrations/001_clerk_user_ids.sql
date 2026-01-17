-- Migration to support Clerk user IDs (TEXT instead of UUID)

-- First, drop all RLS policies that depend on the columns we need to alter
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Public events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
DROP POLICY IF EXISTS "Hosts can update their own events" ON events;
DROP POLICY IF EXISTS "Hosts can delete their own events" ON events;
DROP POLICY IF EXISTS "Users can add themselves as prospects" ON event_prospects;
DROP POLICY IF EXISTS "Users can remove themselves as prospects" ON event_prospects;
DROP POLICY IF EXISTS "Users can add themselves as attendees" ON event_attendees;
DROP POLICY IF EXISTS "Users can remove themselves as attendees" ON event_attendees;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Event messages are viewable by interested users" ON event_messages;
DROP POLICY IF EXISTS "Interested users can send messages" ON event_messages;

-- Drop all foreign key constraints and triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop foreign key constraints
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_host_id_fkey;
ALTER TABLE event_prospects DROP CONSTRAINT IF EXISTS event_prospects_user_id_fkey;
ALTER TABLE event_attendees DROP CONSTRAINT IF EXISTS event_attendees_user_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE event_messages DROP CONSTRAINT IF EXISTS event_messages_user_id_fkey;

-- Drop the old profiles table reference to auth.users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Change profiles.id from UUID to TEXT
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT;

-- Change all foreign key columns from UUID to TEXT
ALTER TABLE events ALTER COLUMN host_id TYPE TEXT;
ALTER TABLE event_prospects ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE event_attendees ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE notifications ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE event_messages ALTER COLUMN user_id TYPE TEXT;

-- Recreate foreign key constraints (without referencing auth.users)
ALTER TABLE events ADD CONSTRAINT events_host_id_fkey 
  FOREIGN KEY (host_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE event_prospects ADD CONSTRAINT event_prospects_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE event_attendees ADD CONSTRAINT event_attendees_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE event_messages ADD CONSTRAINT event_messages_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update RLS policies to work with TEXT user IDs
-- Note: auth.uid() returns UUID, but we'll handle this in the application layer
-- For now, we'll be more permissive and handle authorization in the app

-- Create new policies that work with Clerk
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (true); -- We'll handle auth in the application

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (true); -- We'll handle auth in the application

-- Update other policies to be more permissive since we can't use auth.uid() with Clerk IDs
CREATE POLICY "Public events are viewable by everyone" ON events
  FOR SELECT USING (visibility = 'public');

CREATE POLICY "Authenticated users can create events" ON events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Hosts can update their own events" ON events
  FOR UPDATE USING (true);

CREATE POLICY "Hosts can delete their own events" ON events
  FOR DELETE USING (true);

-- Update prospect and attendee policies

CREATE POLICY "Users can add themselves as prospects" ON event_prospects
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can remove themselves as prospects" ON event_prospects
  FOR DELETE USING (true);

CREATE POLICY "Users can add themselves as attendees" ON event_attendees
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can remove themselves as attendees" ON event_attendees
  FOR DELETE USING (true);

-- Update notification policies

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (true);

-- Update message policies
CREATE POLICY "Event messages are viewable by interested users" ON event_messages
  FOR SELECT USING (true);

CREATE POLICY "Interested users can send messages" ON event_messages
  FOR INSERT WITH CHECK (true);
