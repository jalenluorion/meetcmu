// Database types for MeetCMU

export type EventStatus = 'tentative' | 'official';
export type EventVisibility = 'public' | 'private';
export type NotificationType = 'prospect_joined' | 'event_official' | 'event_updated' | 'event_cancelled';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  interests: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  host_id: string;
  title: string;
  description: string | null;
  date_time: string | null;
  end_time: string | null;
  location: string | null;
  tags: string[] | null;
  status: EventStatus;
  visibility: EventVisibility;
  created_at: string;
  updated_at: string;
}

export interface EventProspect {
  id: string;
  event_id: string;
  user_id: string;
  created_at: string;
}

export interface EventAttendee {
  id: string;
  event_id: string;
  user_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  event_id: string | null;
  type: NotificationType;
  message: string;
  read: boolean;
  created_at: string;
}

// Extended types with joined data
export interface EventWithHost extends Event {
  host: Profile;
  prospect_count: number;
  attendee_count: number;
  user_is_prospect?: boolean;
  user_is_attendee?: boolean;
}

export interface EventWithDetails extends EventWithHost {
  prospects: Profile[];
  attendees: Profile[];
}
