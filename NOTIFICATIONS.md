# Notifications System

This document describes the comprehensive notifications system implemented in MeetCMU.

## Features

### Notification Types

1. **New Message** (`new_message`)
   - Triggered when someone sends a message in an event chat
   - Sent to all interested users (prospects/attendees/host) except the sender
   - Automatically triggered when messages are sent

2. **Event Became Official** (`event_official`)
   - Triggered when a tentative event becomes official
   - Sent to all prospects who showed interest
   - Prospects are automatically converted to attendees

3. **Event Starting Soon** (`event_starting_soon`)
   - Triggered 1 hour before an official event starts
   - Sent to all attendees
   - Requires cron job setup (see below)

4. **Event Starting Now** (`event_starting_now`)
   - Triggered when an official event is starting (within 5 minutes)
   - Sent to all attendees
   - Requires cron job setup (see below)

5. **Milestone Notifications** (`milestone_X_interested`)
   - Triggered when an event reaches 5, 10, 20, 50, or 100 interested people
   - Sent to the event host
   - Automatically triggered when users join/show interest
   - Only one milestone notification per threshold

6. **Event Time Changed** (`event_time_changed`)
   - Triggered when event date/time is updated
   - Sent to all interested users
   - Must be manually triggered in edit event form

7. **Event Cancelled** (`event_cancelled`)
   - Triggered when an event is cancelled/deleted
   - Sent to all interested users
   - Must be manually triggered when deleting events

## Components

### NotificationsDropdown
Located at: `/components/notifications-dropdown.tsx`

A bell icon dropdown in the navbar that shows:
- Unread notification count badge
- List of recent notifications (up to 50)
- Mark as read functionality
- Mark all as read button
- Delete individual notifications
- Auto-refresh every 30 seconds

### API Routes

#### GET `/api/notifications`
Fetch user's notifications
- Query params: `unreadOnly=true` (optional)
- Returns: Array of notifications with event details

#### PATCH `/api/notifications`
Mark notifications as read
- Body: `{ notificationId: string }` or `{ markAllRead: true }`

#### DELETE `/api/notifications`
Delete notifications
- Query params: `id=<notificationId>` or `deleteAll=true`

#### POST `/api/notifications/create`
Create a notification (internal use)
- Body: `{ userId, eventId?, type, message, link?, metadata? }`

#### POST `/api/notifications/trigger-message`
Trigger new message notifications
- Body: `{ eventId, senderId }`
- Automatically called when messages are sent

#### POST `/api/notifications/trigger-milestone`
Trigger milestone notifications
- Body: `{ eventId, currentCount, previousCount }`
- Automatically called when users join/show interest

#### GET `/api/notifications/check-events`
Check for events starting soon/now (cron job endpoint)
- Requires `Authorization: Bearer <CRON_SECRET>` header
- Should be called every 5 minutes

## Database Schema

### notifications table
```sql
- id: UUID (primary key)
- user_id: TEXT (references profiles)
- event_id: UUID (references events, nullable)
- type: TEXT (notification type)
- message: TEXT (notification message)
- read: BOOLEAN (default false)
- link: TEXT (optional link to navigate to)
- metadata: JSONB (additional data)
- created_at: TIMESTAMP
```

## Setup Instructions

### 1. Run Database Migration
```bash
# Apply the enhanced notifications migration
psql -d your_database < supabase/migrations/002_enhanced_notifications.sql
```

### 2. Set Up Cron Job (Optional but Recommended)
For "event starting soon" and "event starting now" notifications, set up a cron job to call the check-events endpoint every 5 minutes.

#### Option A: Using Vercel Cron Jobs
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/notifications/check-events",
    "schedule": "*/5 * * * *"
  }]
}
```

#### Option B: Using External Cron Service
Use a service like cron-job.org or EasyCron to call:
```
GET https://your-domain.com/api/notifications/check-events
Authorization: Bearer YOUR_CRON_SECRET
```

Set `CRON_SECRET` environment variable for security.

### 3. Environment Variables
```env
CRON_SECRET=your-secret-key-here  # Optional, for cron job authentication
```

## Usage Examples

### Trigger notification when event becomes official
```typescript
import { handleEventBecameOfficial } from '@/lib/event-notifications';

// In your edit event form
if (previousStatus === 'tentative' && newStatus === 'official') {
  await handleEventBecameOfficial(eventId, eventTitle);
}
```

### Trigger notification when event time changes
```typescript
import { handleEventTimeChanged } from '@/lib/event-notifications';

// In your edit event form
if (dateTimeChanged) {
  await handleEventTimeChanged(eventId, eventTitle, newDateTime, status);
}
```

### Trigger notification when event is cancelled
```typescript
import { handleEventCancelled } from '@/lib/event-notifications';

// Before deleting an event
await handleEventCancelled(eventId, eventTitle, status);
```

## Additional Notification Ideas

Consider implementing these in the future:
- **New Event in Your Interest Area**: Notify users when events matching their interests are created
- **Event Reminder**: 24 hours before event
- **Host Response**: When host replies to your message
- **Event Full**: When event reaches capacity
- **Waitlist Available**: When spot opens up in full event
- **Friend Joined**: When someone you follow joins an event
- **Event Updated**: When event details (location, description) change
- **RSVP Deadline**: Reminder before RSVP deadline

## Testing

To test notifications locally:
1. Create an event and have users show interest
2. Send messages in event chat
3. Manually call the cron endpoint: `GET http://localhost:3000/api/notifications/check-events`
4. Check the notifications dropdown in the navbar
