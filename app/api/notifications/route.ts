import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from '@clerk/nextjs/server';

// GET - Fetch user's notifications
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const unreadOnly = searchParams.get('unreadOnly') === 'true';

  let query = supabase
    .from('notifications')
    .select(`
      *,
      event:events(
        id,
        title,
        date_time
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (unreadOnly) {
    query = query.eq('read', false);
  }

  const { data: notifications, error } = await query;

  if (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Error loading notifications' }, { status: 500 });
  }

  return NextResponse.json({ notifications });
}

// PATCH - Mark notification(s) as read
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { notificationId, markAllRead } = body;

  if (markAllRead) {
    // Mark all notifications as read
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return NextResponse.json({ error: 'Error updating notifications' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } else if (notificationId) {
    // Mark single notification as read
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error marking notification as read:', error);
      return NextResponse.json({ error: 'Error updating notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}

// DELETE - Delete notification(s)
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const notificationId = searchParams.get('id');
  const deleteAll = searchParams.get('deleteAll') === 'true';

  if (deleteAll) {
    // Delete all read notifications
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)
      .eq('read', true);

    if (error) {
      console.error('Error deleting notifications:', error);
      return NextResponse.json({ error: 'Error deleting notifications' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } else if (notificationId) {
    // Delete single notification
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting notification:', error);
      return NextResponse.json({ error: 'Error deleting notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}
