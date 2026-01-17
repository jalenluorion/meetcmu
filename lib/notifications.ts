// Notification helper functions

export type NotificationType = 
  | 'new_message'
  | 'event_official'
  | 'event_starting_soon'
  | 'event_starting_now'
  | 'milestone_5_interested'
  | 'milestone_10_interested'
  | 'milestone_20_interested'
  | 'milestone_50_interested'
  | 'milestone_100_interested'
  | 'event_updated'
  | 'event_cancelled'
  | 'event_time_changed'
  | 'new_attendee';

export interface CreateNotificationParams {
  userId: string;
  eventId?: string;
  type: NotificationType;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

// Create a notification
export async function createNotification(params: CreateNotificationParams) {
  try {
    const response = await fetch('/api/notifications/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Failed to create notification');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

// Create notifications for event milestones
export async function checkAndCreateMilestoneNotification(
  eventId: string,
  hostId: string,
  currentCount: number,
  previousCount: number,
  eventTitle: string,
  isTentative: boolean
) {
  const milestones = [5, 10, 20, 50, 100];
  const type = isTentative ? 'interested' : 'joined';
  
  for (const milestone of milestones) {
    if (currentCount >= milestone && previousCount < milestone) {
      await createNotification({
        userId: hostId,
        eventId,
        type: `milestone_${milestone}_interested` as NotificationType,
        message: `${milestone} people are ${type} in "${eventTitle}"!`,
        link: `/${eventId}`,
        metadata: { count: currentCount, milestone },
      });
      break; // Only send one milestone notification at a time
    }
  }
}

// Create notification for new message
export async function notifyNewMessage(
  eventId: string,
  senderId: string,
  senderName: string,
  eventTitle: string,
  interestedUserIds: string[]
) {
  // Notify all interested users except the sender
  const recipients = interestedUserIds.filter(id => id !== senderId);
  
  for (const userId of recipients) {
    await createNotification({
      userId,
      eventId,
      type: 'new_message',
      message: `${senderName} sent a message in "${eventTitle}"`,
      link: `/${eventId}`,
      metadata: { senderId, senderName },
    });
  }
}

// Create notification when event becomes official
export async function notifyEventOfficial(
  eventId: string,
  eventTitle: string,
  prospectUserIds: string[]
) {
  for (const userId of prospectUserIds) {
    await createNotification({
      userId,
      eventId,
      type: 'event_official',
      message: `"${eventTitle}" is now official! 🎉`,
      link: `/${eventId}`,
    });
  }
}

// Create notification for event starting soon (1 hour before)
export async function notifyEventStartingSoon(
  eventId: string,
  eventTitle: string,
  attendeeUserIds: string[]
) {
  for (const userId of attendeeUserIds) {
    await createNotification({
      userId,
      eventId,
      type: 'event_starting_soon',
      message: `"${eventTitle}" starts in 1 hour!`,
      link: `/${eventId}`,
    });
  }
}

// Create notification for event starting now
export async function notifyEventStartingNow(
  eventId: string,
  eventTitle: string,
  attendeeUserIds: string[]
) {
  for (const userId of attendeeUserIds) {
    await createNotification({
      userId,
      eventId,
      type: 'event_starting_now',
      message: `"${eventTitle}" is starting now! 🚀`,
      link: `/${eventId}`,
    });
  }
}

// Create notification for event time change
export async function notifyEventTimeChanged(
  eventId: string,
  eventTitle: string,
  newDateTime: string,
  interestedUserIds: string[]
) {
  const formattedDate = new Date(newDateTime).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });

  for (const userId of interestedUserIds) {
    await createNotification({
      userId,
      eventId,
      type: 'event_time_changed',
      message: `"${eventTitle}" time changed to ${formattedDate}`,
      link: `/${eventId}`,
      metadata: { newDateTime },
    });
  }
}

// Create notification for event cancellation
export async function notifyEventCancelled(
  eventId: string,
  eventTitle: string,
  interestedUserIds: string[]
) {
  for (const userId of interestedUserIds) {
    await createNotification({
      userId,
      eventId,
      type: 'event_cancelled',
      message: `"${eventTitle}" has been cancelled`,
      link: `/${eventId}`,
    });
  }
}
