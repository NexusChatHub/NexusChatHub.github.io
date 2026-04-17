'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  supabase,
  isSupabaseConfigured,
  SUPABASE_CONFIG_ERROR,
} from '@/lib/supabase';
import type {
  AppUser,
  Channel,
  Message,
  Profile,
  EntityId,
  PresenceUser,
  TypingUser,
  AppNotification,
  UserRole,
  MessageReaction,
} from '@/components/chat/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

function aggregateReactions(
  reactions: Record<string, unknown>[],
  currentUserId?: string,
) {
  const map: Record<string, MessageReaction> = {};
  reactions.forEach((r) => {
    const emoji = String(r.emoji);
    if (!map[emoji]) map[emoji] = { emoji, count: 0, user_reacted: false };
    map[emoji].count++;
    if (String(r.user_id) === currentUserId) map[emoji].user_reacted = true;
  });
  return Object.values(map);
}

export type Toast = {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
};

export function useChat() {
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'error') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const fetchChannels = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setChannels([]);
      return;
    }
    const { data, error } = await supabase.from('channels').select('*').order('name');
    if (!error && data) setChannels(data as Channel[]);
  }, []);

  const fetchFriends = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured) {
      setFriends([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('friends')
        .select('friend_id, status')
        .eq('user_id', userId)
        .eq('status', 'accepted');

      if (error || !data) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .limit(5);
        if (profileData) setFriends(profileData as unknown as Profile[]);
        return;
      }
      
      const friendIds = data.map(f => f.friend_id);
      if (friendIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', friendIds);
        if (profiles) setFriends(profiles as unknown as Profile[]);
      } else {
        setFriends([]);
      }
    } catch {
      setFriends([]);
    }
  }, []);

  useEffect(() => {
    if (!activeChannel) return;

    const refreshedChannel = channels.find(
      (channel) => String(channel.id) === String(activeChannel.id),
    );

    if (!refreshedChannel) {
      const timer = window.setTimeout(() => {
        setActiveChannel(null);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    if (
      refreshedChannel.name !== activeChannel.name ||
      refreshedChannel.description !== activeChannel.description ||
      refreshedChannel.created_by !== activeChannel.created_by
    ) {
      const timer = window.setTimeout(() => {
        setActiveChannel(refreshedChannel);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [activeChannel, channels]);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      if (!isSupabaseConfigured) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        if (!isMounted) return;
        setUser(session.user);
        await Promise.all([fetchChannels(), fetchFriends(session.user.id)]);
      } catch (err) {
        addToast(err instanceof Error ? err.message : 'Connection failed.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    init();

    if (!isSupabaseConfigured) {
      return () => {
        isMounted = false;
      };
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        void fetchFriends(session.user.id);
      } else {
        setUser(null);
        setFriends([]);
        setMessages([]);
        setNotifications([]);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchChannels, fetchFriends, addToast]);

  // Messages subscription
  useEffect(() => {
    if (!isSupabaseConfigured) {
      const timer = window.setTimeout(() => {
        setMessages([]);
        setMessagesLoading(false);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    if (!activeChannel) {
      const timer = window.setTimeout(() => {
        setMessages([]);
        setOnlineUsers([]);
        setTypingUsers([]);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    let cancelled = false;

    const fetchMessages = async () => {
      setMessagesLoading(true);
      try {
        const { data, error: messageError } = await supabase
          .from('messages')
          .select('*, profiles(username, avatar_url), reactions(*)')
          .eq('channel_id', activeChannel.id)
          .order('created_at', { ascending: true });

        if (cancelled) return;

        if (messageError) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('messages')
            .select('*, profiles(username, avatar_url)')
            .eq('channel_id', activeChannel.id)
            .order('created_at', { ascending: true });
          
          if (!fallbackError) setMessages((fallbackData || []) as Message[]);
        } else if (data) {
          const processed = (data as Record<string, unknown>[]).map((msg) => ({
            ...msg,
            reactions: aggregateReactions(
              (msg.reactions as Record<string, unknown>[]) || [],
              user?.id,
            ),
          }));
          setMessages(processed as unknown as Message[]);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    };

    void fetchMessages();

    const channelName = `realtime:chat:${activeChannel.id}`;
    const sub = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${activeChannel.id}`,
        },
        async (payload) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', payload.new.user_id)
            .single();

          if (cancelled) return;
          setMessages((curr) => {
            if (curr.some((m) => String(m.id) === String(payload.new.id))) return curr;
            return [
              ...curr,
              {
                ...(payload.new as Record<string, unknown>),
                profiles: profileData,
                reactions: [],
              } as unknown as Message,
            ];
          });

          if (payload.new.user_id !== user?.id) {
            const notif: AppNotification = {
              id: String(payload.new.id),
              type: 'message',
              title: `#${activeChannel.name}`,
              body: String(payload.new.content).slice(0, 80),
              read: false,
              created_at: payload.new.created_at as string,
              channel_id: activeChannel.id,
            };
            setNotifications((prev) => [notif, ...prev].slice(0, 20));
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${activeChannel.id}`,
        },
        (payload) => {
          if (cancelled) return;
          setMessages((curr) =>
            curr.map((m) =>
              String(m.id) === String(payload.new.id)
                ? { ...m, content: payload.new.content as string, edited_at: payload.new.updated_at as string }
                : m,
            ),
          );
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${activeChannel.id}`,
        },
        (payload) => {
          setMessages((curr) => curr.filter((m) => String(m.id) !== String(payload.old.id)));
        },
      )
      .subscribe();

    const reactionSub = supabase
      .channel(`realtime:reactions:${activeChannel.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, async (payload) => {
        if (cancelled) return;

        const messageId = (payload.new as Record<string, unknown>)?.message_id || (payload.old as Record<string, unknown>)?.message_id;
        if (!messageId) return;

        const { data: reactionData } = await supabase
          .from('reactions')
          .select('*')
          .eq('message_id', messageId);

        setMessages((curr) =>
          curr.map((m) =>
            String(m.id) === String(messageId)
              ? ({ ...m, reactions: aggregateReactions((reactionData as Record<string, unknown>[]) || [], user?.id) })
              : m
          )
        );
      })
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(sub);
      void supabase.removeChannel(reactionSub);
    };
  }, [activeChannel, user?.id]);

  // Presence + typing indicators
  useEffect(() => {
    if (!isSupabaseConfigured || !user || !activeChannel) return;

    const presenceChannel = supabase.channel(`presence:${activeChannel.id}`, {
      config: { presence: { key: user.id } },
    });
    presenceChannelRef.current = presenceChannel;

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const users = Object.values(state).flatMap((presences) =>
          (presences as Record<string, unknown>[]).map((p) => ({
            id: p.id as string,
            username: (p.username as string) || 'Guest',
            online_at: p.online_at as string,
            role: (p.id === activeChannel.created_by ? 'creator' : 'member') as UserRole,
          })),
        );
        setOnlineUsers(users as PresenceUser[]);
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const typingUser = payload as TypingUser & { stopped?: boolean };
        if (typingUser.id === user.id) return;

        if (typingUser.stopped) {
          setTypingUsers((prev) => prev.filter((u) => u.id !== typingUser.id));
        } else {
          setTypingUsers((prev) => {
            const exists = prev.some((u) => u.id === typingUser.id);
            if (exists) return prev;
            return [...prev, { id: typingUser.id, username: typingUser.username }];
          });
          setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u.id !== typingUser.id));
          }, 4000);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            id: user.id,
            username: user.user_metadata?.full_name || user.email?.split('@')[0],
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      if (presenceChannelRef.current === presenceChannel) {
        presenceChannelRef.current = null;
      }
      setOnlineUsers([]);
      setTypingUsers([]);
      void supabase.removeChannel(presenceChannel);
    };
  }, [activeChannel, user]);

  const sendMessage = async (content: string) => {
    if (!isSupabaseConfigured) throw new Error(SUPABASE_CONFIG_ERROR);
    if (!user || !activeChannel) return;
    const { error } = await supabase
      .from('messages')
      .insert({ content, channel_id: activeChannel.id, user_id: user.id });
    if (error) throw error;
  };

  const createChannel = async (name: string, description: string) => {
    if (!isSupabaseConfigured) throw new Error(SUPABASE_CONFIG_ERROR);
    if (!user) return;
    const { data, error } = await supabase
      .from('channels')
      .insert({ name, description, created_by: user.id })
      .select()
      .single();
    if (error) throw error;
    await fetchChannels();
    return data as Channel;
  };

  const updateChannel = async (id: EntityId, name: string, description: string) => {
    if (!isSupabaseConfigured) throw new Error(SUPABASE_CONFIG_ERROR);
    const { error } = await supabase
      .from('channels')
      .update({ name, description })
      .eq('id', id);
    if (error) throw error;
    await fetchChannels();
  };

  const deleteChannel = async (id: EntityId) => {
    if (!isSupabaseConfigured) throw new Error(SUPABASE_CONFIG_ERROR);
    const { error } = await supabase.from('channels').delete().eq('id', id);
    if (error) throw error;
    await fetchChannels();
  };

  const addFriend = async (email: string) => {
    if (!isSupabaseConfigured) throw new Error(SUPABASE_CONFIG_ERROR);
    if (!user) return;
    const { data: friendProfile, error: findError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (findError || !friendProfile) {
      throw new Error('User not found in Nexus.');
    }

    const { error: addError } = await supabase.from('friends').insert({
      user_id: user.id,
      friend_id: friendProfile.id,
      status: 'pending',
    });

    if (addError) throw addError;
    await fetchFriends(user.id);
  };

  const deleteMessage = async (messageId: EntityId) => {
    if (!isSupabaseConfigured) throw new Error(SUPABASE_CONFIG_ERROR);
    const { error } = await supabase.from('messages').delete().eq('id', messageId);
    if (error) throw error;
  };

  const editMessage = async (messageId: EntityId, newContent: string) => {
    if (!isSupabaseConfigured) throw new Error(SUPABASE_CONFIG_ERROR);
    const { error } = await supabase
      .from('messages')
      .update({ content: newContent })
      .eq('id', messageId);
    if (error) throw error;
  };

  const toggleReaction = async (messageId: EntityId, emoji: string) => {
    if (!isSupabaseConfigured) throw new Error(SUPABASE_CONFIG_ERROR);
    if (!user) return;
    const { data: existing } = await supabase
      .from('reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .eq('emoji', emoji)
      .maybeSingle();

    if (existing) {
      await supabase.from('reactions').delete().eq('id', existing.id);
    } else {
      await supabase
        .from('reactions')
        .insert({ message_id: messageId, user_id: user.id, emoji });
    }
  };

  const broadcastTyping = (stopped = false) => {
    if (!user || !activeChannel || !presenceChannelRef.current) return;
    void presenceChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        id: user.id,
        username: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        stopped,
      },
    });
  };

  const refreshUser = useCallback(async () => {
    if (!isSupabaseConfigured) throw new Error(SUPABASE_CONFIG_ERROR);
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    setUser(data.user);
  }, []);

  return {
    user,
    channels,
    activeChannel,
    setActiveChannel,
    messages,
    onlineUsers,
    friends,
    typingUsers,
    loading,
    messagesLoading,
    toasts,
    addToast,
    notifications,
    setNotifications,
    sendMessage,
    createChannel,
    updateChannel,
    deleteChannel,
    addFriend,
    deleteMessage,
    editMessage,
    toggleReaction,
    broadcastTyping,
    refreshUser,
  };
}
