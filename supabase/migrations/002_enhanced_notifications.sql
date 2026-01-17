-- Enhanced notifications system
-- Drop existing notification type constraint and add new types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'new_message',
  'event_official',
  'event_starting_soon',
  'event_starting_now',
  'milestone_5_interested',
  'milestone_10_interested',
  'milestone_20_interested',
  'milestone_50_interested',
  'milestone_100_interested',
  'event_updated',
  'event_cancelled',
  'event_time_changed',
  'new_attendee'
));

-- Add link field for notification actions
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT;

-- Add metadata field for additional notification data
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for faster notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read, created_at DESC);

-- Policy to allow system to create notifications
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);
