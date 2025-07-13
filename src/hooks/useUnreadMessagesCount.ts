import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

let forceUpdateUnread: (() => void)[] = [];

export function useUnreadMessagesCount(userId: string | undefined) {
  const [count, setCount] = useState(0);

  const fetchUnread = async () => {
    if (!userId) return;
    // @ts-expect-error: Supabase types are too deep here
    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);
    setCount(count || 0);
  };

  useEffect(() => {
    if (!userId) return;
    fetchUnread();

    // Subscribe to real-time changes for live update
    const channel = supabase
      .channel('messages-unread')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchUnread)
      .subscribe();

    // Register force update
    forceUpdateUnread.push(fetchUnread);

    return () => {
      supabase.removeChannel(channel);
      forceUpdateUnread = forceUpdateUnread.filter(fn => fn !== fetchUnread);
    };
  }, [userId]);

  return count;
}

export function triggerUnreadCountUpdate() {
  forceUpdateUnread.forEach(fn => fn());
} 