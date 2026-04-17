'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Search,
  Hash,
  Bell,
  Sparkles,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ShieldEllipsis,
  Activity,
  Zap,
  X,
  Check,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ChatInsights } from '@/components/chat/ChatInsights';
import { MessageInput } from '@/components/chat/MessageInput';
import { MessageList } from '@/components/chat/MessageList';
import { Sidebar } from '@/components/chat/Sidebar';
import { CreateChannelModal } from '@/components/modals/CreateChannelModal';
import { AddFriendModal } from '@/components/modals/AddFriendModal';
import { EditChannelModal } from '@/components/modals/EditChannelModal';
import type {
  AppUser,
  Channel,
  Message,
  PresenceUser,
  UserRole,
  Profile,
  EntityId,
  TypingUser,
  AppNotification,
} from '@/components/chat/types';

const ACTIVE_CHANNEL_STORAGE_KEY = 'nexus.active-channel';

function aggregateReactions(
  reactions: Record<string, unknown>[],
  currentUserId?: string,
) {
  const map: Record<string, { emoji: string; count: number; user_reacted: boolean }> = {};
  reactions.forEach((r) => {
    const emoji = String(r.emoji);
    if (!map[emoji]) map[emoji] = { emoji, count: 0, user_reacted: false };
    map[emoji].count++;
    if (String(r.user_id) === currentUserId) map[emoji].user_reacted = true;
  });
  return Object.values(map);
}

type Toast = {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
};

export default function ChatPage() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [channelQuery, setChannelQuery] = useState('');
  const [messageQuery, setMessageQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isEditChannelOpen, setIsEditChannelOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  const addToast = useCallback((message: string, type: Toast['type'] = 'error') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Theme sync
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.className = savedTheme;
  }, []);

  // Close notif dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isRestricted = useMemo(
    () => user?.user_metadata?.restricted === true,
    [user],
  );

  const currentUserRole = useMemo((): UserRole => {
    if (!user || !activeChannel) return 'member';
    if (activeChannel.created_by === user.id) return 'creator';
    return 'member';
  }, [user, activeChannel]);

  const fetchChannels = useCallback(async () => {
    const { data, error } = await supabase.from('channels').select('*').order('name');
    if (!error && data) setChannels(data as Channel[]);
  }, []);

  const fetchFriends = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('friends')
        .select('friend_id, status')
        .eq('user_id', user.id)
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
      }
    } catch {
      setFriends([]);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth');
          return;
        }
        if (!isMounted) return;
        setUser(session.user);
        await Promise.all([fetchChannels(), fetchFriends()]);
      } catch (err) {
        addToast(err instanceof Error ? err.message : 'Connection failed.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') router.push('/auth');
      if (session) {
        setUser(session.user);
        void fetchFriends();
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router, fetchChannels, fetchFriends, addToast]);

  // Fetch friends when user is set
  useEffect(() => {
    if (user) void fetchFriends();
  }, [user, fetchFriends]);

  // Restore last active channel
  useEffect(() => {
    if (channels.length > 0 && !activeChannel) {
      const savedId = window.localStorage.getItem(ACTIVE_CHANNEL_STORAGE_KEY);
      const preferred = channels.find((c) => String(c.id) === savedId) ?? channels[0];
      setActiveChannel(preferred);
    }
  }, [channels, activeChannel]);

  useEffect(() => {
    if (!activeChannel) return;
    window.localStorage.setItem(ACTIVE_CHANNEL_STORAGE_KEY, String(activeChannel.id));
    setMessageQuery('');
    setSidebarOpen(false);
  }, [activeChannel]);

  // Messages subscription (INSERT, UPDATE, DELETE)
  useEffect(() => {
    if (!activeChannel) {
      setMessages([]);
      return;
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
          // Fallback if reactions table missing
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
            return [...curr, { ...payload.new, profiles: profileData } as Message];
          });

          // Add notification for messages from others
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

    // Reactions subscription
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
    if (!user || !activeChannel) return;

    const presenceChannel = supabase.channel(`presence:${activeChannel.id}`, {
      config: { presence: { key: user.id } },
    });

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
      // Typing indicators via broadcast
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
          // Auto-clear after 4s
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
      void supabase.removeChannel(presenceChannel);
    };
  }, [activeChannel, user]);

  const handleTypingStart = useCallback(() => {
    if (!user || !activeChannel) return;
    const ch = supabase.channel(`presence:${activeChannel.id}`);
    void ch.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        id: user.id,
        username: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      },
    });
  }, [user, activeChannel]);

  const handleTypingStop = useCallback(() => {
    if (!user || !activeChannel) return;
    const ch = supabase.channel(`presence:${activeChannel.id}`);
    void ch.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        id: user.id,
        username: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        stopped: true,
      },
    });
  }, [user, activeChannel]);

  const handleSendMessage = async (content: string) => {
    if (!user || !activeChannel || isSending) return;
    if (isRestricted && content.length > 200) {
      addToast('Restricted accounts are limited to 200 characters per message.');
      return;
    }
    setIsSending(true);
    try {
      const { error: sendError } = await supabase
        .from('messages')
        .insert({ content, channel_id: activeChannel.id, user_id: user.id });
      if (sendError) throw sendError;
      setDrafts((curr) => ({ ...curr, [String(activeChannel.id)]: '' }));
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateChannel = async (name: string, description: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('channels')
        .insert({ name, description, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      await fetchChannels();
      setActiveChannel(data as Channel);
      addToast(`#${name} created!`, 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to create channel.');
    }
  };

  const handleUpdateChannel = async (id: EntityId, name: string, description: string) => {
    try {
      const { error } = await supabase
        .from('channels')
        .update({ name, description })
        .eq('id', id);
      if (error) throw error;
      await fetchChannels();
      // Update activeChannel
      setActiveChannel((prev) => (prev && String(prev.id) === String(id) ? { ...prev, name, description } : prev));
      addToast('Channel updated!', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to update channel.');
    }
  };

  const handleDeleteChannel = async (id: EntityId) => {
    try {
      const { error } = await supabase.from('channels').delete().eq('id', id);
      if (error) throw error;
      await fetchChannels();
      setActiveChannel(null);
      addToast('Channel deleted.', 'info');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete channel.');
    }
  };

  const handleAddFriend = async (email: string) => {
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
    await fetchFriends();
    addToast('Friend request sent!', 'success');
  };

  const handleDeleteMessage = async (messageId: EntityId) => {
    try {
      const { error } = await supabase.from('messages').delete().eq('id', messageId);
      if (error) throw error;
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete message.');
    }
  };

  const handleEditMessage = async (messageId: EntityId, newContent: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ content: newContent })
        .eq('id', messageId);
      if (error) throw error;
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to edit message.');
    }
  };

  const handleToggleReaction = async (messageId: EntityId, emoji: string) => {
    if (!user) return;
    try {
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
    } catch (err) {
      console.error('Reaction toggle failed:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const activeDraft = activeChannel ? drafts[String(activeChannel.id)] ?? '' : '';
  const filteredMessages = messages.filter((m) =>
    m.content.toLowerCase().includes(messageQuery.toLowerCase()),
  );
  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(channelQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--glow)_0%,transparent_70%)] opacity-50" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-8 relative z-10"
        >
          <div className="relative mx-auto w-24 h-24">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-[32px] flex items-center justify-center animate-pulse shadow-2xl shadow-blue-500/30">
              <Zap className="w-12 h-12 text-white fill-white" />
            </div>
            <Sparkles className="w-8 h-8 text-blue-400 absolute -top-3 -right-3 animate-bounce" />
          </div>
          <div className="space-y-2">
            <p className="text-[var(--text-primary)] text-xl font-black tracking-[0.2em] uppercase">
              Connecting...
            </p>
            <div className="flex items-center justify-center gap-2">
              <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
              <span className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.3em]">
                Loading workspace
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden font-sans selection:bg-blue-500/30 transition-colors duration-500">
      <Sidebar
        channels={filteredChannels}
        activeChannel={activeChannel}
        onSelectChannel={setActiveChannel}
        user={user}
        searchValue={channelQuery}
        onSearchChange={setChannelQuery}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onCreateChannel={() => setIsCreateModalOpen(true)}
        onAddFriend={() => setIsAddFriendModalOpen(true)}
        friends={friends}
      />

      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="h-16 border-b border-[var(--border-color)] flex items-center justify-between px-4 md:px-6 bg-[var(--bg-primary)]/90 backdrop-blur-2xl z-30 transition-all">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all bg-[var(--bg-tertiary)] rounded-xl active:scale-95"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[14px] bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center text-blue-500 shadow-sm">
                <Hash className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base font-black text-[var(--text-primary)] truncate tracking-tighter uppercase">
                    {activeChannel?.name || 'Select a channel'}
                  </h1>
                  {currentUserRole === 'creator' && (
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center gap-1">
                        <ShieldCheck className="w-2.5 h-2.5 text-blue-500" />
                        <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Creator</span>
                      </span>
                      <button
                        onClick={() => setIsEditChannelOpen(true)}
                        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-all"
                        title="Edit Channel"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {isRestricted && (
                    <span className="px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 flex items-center gap-1">
                      <ShieldAlert className="w-2.5 h-2.5 text-orange-500" />
                      <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest">Restricted</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)] animate-pulse" />
                  <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.15em]">
                    {onlineUsers.length} online
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="hidden md:flex items-center bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-[var(--bg-primary)] transition-all group w-56">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] group-focus-within:text-blue-500 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search messages..."
                className="bg-transparent border-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none ml-2 w-full font-medium"
                value={messageQuery}
                onChange={(e) => setMessageQuery(e.target.value)}
              />
              {messageQuery && (
                <button onClick={() => setMessageQuery('')} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all rounded-xl hover:bg-[var(--bg-tertiary)] relative active:scale-95"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-80 glass rounded-2xl border border-[var(--border-color)] shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-[10px] text-blue-500 font-black uppercase tracking-widest hover:underline flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto scrollbar-hide">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">
                            No notifications yet
                          </p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-4 border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer ${
                              !n.read ? 'bg-blue-500/5' : ''
                            }`}
                            onClick={() => {
                              setNotifications((prev) =>
                                prev.map((notif) =>
                                  notif.id === n.id ? { ...notif, read: true } : notif,
                                ),
                              );
                            }}
                          >
                            <div className="flex items-start gap-3">
                              {!n.read && (
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                              )}
                              <div className={`min-w-0 ${n.read ? 'ml-4' : ''}`}>
                                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                                  {n.title}
                                </p>
                                <p className="text-xs text-[var(--text-primary)] font-medium mt-1 truncate">
                                  {n.body}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-px h-6 bg-[var(--border-color)] mx-1 hidden sm:block" />

            {/* Intel toggle */}
            <button
              onClick={() => setInsightsOpen(!insightsOpen)}
              className={`flex items-center gap-2 px-4 py-2 transition-all rounded-xl border font-black uppercase tracking-[0.15em] text-[10px] active:scale-95 ${
                insightsOpen
                  ? 'text-blue-500 bg-blue-500/10 border-blue-500/30'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] border-transparent'
              }`}
            >
              <ShieldEllipsis className="w-4 h-4" />
              <span className="hidden sm:block">Intel</span>
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 flex flex-col min-w-0">
            <MessageList
              messages={filteredMessages}
              searchQuery={messageQuery}
              channelName={activeChannel?.name}
              channelDescription={activeChannel?.description}
              currentUserId={user?.id}
              loading={messagesLoading}
              currentUserRole={currentUserRole}
              typingUsers={typingUsers}
              onDeleteMessage={handleDeleteMessage}
              onEditMessage={handleEditMessage}
              onToggleReaction={handleToggleReaction}
            />
            <MessageInput
              value={activeDraft}
              onChange={(val) =>
                setDrafts((curr) => ({ ...curr, [String(activeChannel?.id)]: val }))
              }
              onSendMessage={handleSendMessage}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
              loading={isSending}
              disabled={!activeChannel || messagesLoading}
              activeChannelName={activeChannel?.name}
              isRestricted={isRestricted}
            />
          </div>

          {/* Desktop insights panel */}
          <AnimatePresence>
            {insightsOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 340, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: 'spring', damping: 30, stiffness: 250 }}
                className="hidden xl:block border-l border-[var(--border-color)] bg-[var(--bg-secondary)]/30 backdrop-blur-3xl overflow-hidden"
              >
                <div className="w-[340px] h-full">
                  <ChatInsights
                    activeChannel={activeChannel}
                    messages={messages}
                    onlineUsers={onlineUsers}
                    isOpen
                    onClose={() => setInsightsOpen(false)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile insights drawer */}
        <AnimatePresence>
          {insightsOpen && (
            <div className="xl:hidden fixed inset-0 z-[60] flex justify-end">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setInsightsOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 250 }}
                className="relative w-80 h-full bg-[var(--bg-primary)] border-l border-[var(--border-color)] shadow-2xl"
              >
                <ChatInsights
                  activeChannel={activeChannel}
                  messages={messages}
                  onlineUsers={onlineUsers}
                  isOpen
                  onClose={() => setInsightsOpen(false)}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Toast notifications */}
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] space-y-2 pointer-events-none">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`pointer-events-auto px-6 py-3 rounded-2xl backdrop-blur-xl shadow-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest whitespace-nowrap ${
                  toast.type === 'error'
                    ? 'bg-red-500/15 border border-red-500/25 text-red-400'
                    : toast.type === 'success'
                    ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-400'
                    : 'bg-blue-500/15 border border-blue-500/25 text-blue-400'
                }`}
              >
                {toast.type === 'error' && <ShieldAlert className="w-4 h-4 flex-shrink-0" />}
                {toast.type === 'success' && <Check className="w-4 h-4 flex-shrink-0" />}
                {toast.message}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      <CreateChannelModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateChannel}
      />
      <AddFriendModal
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
        onAdd={handleAddFriend}
      />
      <EditChannelModal
        isOpen={isEditChannelOpen}
        channel={activeChannel}
        onClose={() => setIsEditChannelOpen(false)}
        onUpdate={handleUpdateChannel}
        onDelete={handleDeleteChannel}
      />
    </div>
  );
}
