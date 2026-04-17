'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Search,
  Hash,
  Bell,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ShieldEllipsis,
  Activity,
  Zap,
  X,
  Check,
} from 'lucide-react';
import { ChatInsights } from '@/components/chat/ChatInsights';
import { MessageInput } from '@/components/chat/MessageInput';
import { MessageList } from '@/components/chat/MessageList';
import { Sidebar } from '@/components/chat/Sidebar';
import { CreateChannelModal } from '@/components/modals/CreateChannelModal';
import { AddFriendModal } from '@/components/modals/AddFriendModal';
import { EditChannelModal } from '@/components/modals/EditChannelModal';
import { ProfileModal } from '@/components/modals/ProfileModal';
import { useChat } from '@/hooks/useChat';
import type {
  UserRole,
  EntityId,
} from '@/components/chat/types';

const ACTIVE_CHANNEL_STORAGE_KEY = 'nexus.active-channel';

function toError(err: unknown, fallback: string) {
  return err instanceof Error ? err : new Error(fallback);
}

export default function ChatPage() {
  const router = useRouter();
  const {
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
  } = useChat();

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [channelQuery, setChannelQuery] = useState('');
  const [messageQuery, setMessageQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isEditChannelOpen, setIsEditChannelOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Auth check
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user, router]);

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

  // Restore last active channel
  useEffect(() => {
    if (channels.length > 0 && !activeChannel) {
      const savedId = window.localStorage.getItem(ACTIVE_CHANNEL_STORAGE_KEY);
      const preferred = channels.find((c) => String(c.id) === savedId) ?? channels[0];
      setActiveChannel(preferred);
    }
  }, [channels, activeChannel, setActiveChannel]);

  useEffect(() => {
    if (!activeChannel) return;
    window.localStorage.setItem(ACTIVE_CHANNEL_STORAGE_KEY, String(activeChannel.id));
    const timer = window.setTimeout(() => {
      setMessageQuery('');
      setSidebarOpen(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeChannel]);

  const handleSendMessage = async (content: string) => {
    if (!user || !activeChannel || isSending) return;
    if (isRestricted && content.length > 200) {
      addToast('Restricted accounts are limited to 200 characters per message.');
      return;
    }
    setIsSending(true);
    try {
      await sendMessage(content);
      setDrafts((curr) => ({ ...curr, [String(activeChannel.id)]: '' }));
    } catch (err) {
      addToast(toError(err, 'Failed to send message.').message);
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateChannel = async (name: string, description: string) => {
    try {
      const newChannel = await createChannel(name, description);
      if (newChannel) setActiveChannel(newChannel);
      addToast(`#${name} created!`, 'success');
    } catch (err) {
      const error = toError(err, 'Failed to create channel.');
      addToast(error.message);
      throw error;
    }
  };

  const handleUpdateChannel = async (id: EntityId, name: string, description: string) => {
    try {
      await updateChannel(id, name, description);
      addToast('Channel updated!', 'success');
    } catch (err) {
      const error = toError(err, 'Failed to update channel.');
      addToast(error.message);
      throw error;
    }
  };

  const handleDeleteChannel = async (id: EntityId) => {
    try {
      const nextChannel =
        channels.find((channel) => String(channel.id) !== String(id)) ?? null;
      await deleteChannel(id);
      setActiveChannel(nextChannel);
      addToast('Channel deleted.', 'info');
    } catch (err) {
      const error = toError(err, 'Failed to delete channel.');
      addToast(error.message);
      throw error;
    }
  };

  const handleAddFriend = async (email: string) => {
    try {
      await addFriend(email);
      addToast('Friend request sent!', 'success');
    } catch (err) {
      const error = toError(err, 'Failed to add friend.');
      addToast(error.message);
      throw error;
    }
  };

  const handleDeleteMessage = async (id: EntityId) => {
    try {
      await deleteMessage(id);
      addToast('Message removed.', 'info');
    } catch (err) {
      const error = toError(err, 'Failed to delete message.');
      addToast(error.message);
      throw error;
    }
  };

  const handleEditMessage = async (id: EntityId, content: string) => {
    try {
      await editMessage(id, content);
      addToast('Message updated.', 'success');
    } catch (err) {
      const error = toError(err, 'Failed to update message.');
      addToast(error.message);
      throw error;
    }
  };

  const handleToggleReaction = async (id: EntityId, emoji: string) => {
    try {
      await toggleReaction(id, emoji);
    } catch (err) {
      const error = toError(err, 'Failed to update reaction.');
      addToast(error.message);
      throw error;
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
  const todayMessageCount = useMemo(() => {
    const now = new Date();
    return messages.filter((message) => {
      const createdAt = new Date(message.created_at);
      return (
        createdAt.getFullYear() === now.getFullYear() &&
        createdAt.getMonth() === now.getMonth() &&
        createdAt.getDate() === now.getDate()
      );
    }).length;
  }, [messages]);
  const contributorCount = useMemo(
    () => new Set(messages.map((message) => message.user_id)).size,
    [messages],
  );
  const spotlightStats = [
    {
      label: 'Realtime',
      value: activeChannel ? (typingUsers.length > 0 ? 'Live activity' : 'Synced') : 'Idle',
    },
    {
      label: 'Today',
      value: `${todayMessageCount} msgs`,
    },
    {
      label: 'Contributors',
      value: `${contributorCount || 0} active`,
    },
  ];

  const handleNotificationClick = (notificationId: string, channelId?: EntityId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif,
      ),
    );

    if (channelId) {
      const channel = channels.find((item) => String(item.id) === String(channelId));
      if (channel) {
        setActiveChannel(channel);
        setNotifOpen(false);
      }
    }
  };

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
        onProfileClick={() => setIsProfileModalOpen(true)}
        friends={friends}
      />

      <main className="flex-1 flex flex-col min-w-0 relative isolate">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-60 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_65%)]" />
          <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-blue-500/8 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-purple-500/6 blur-3xl" />
        </div>

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
                            onClick={() => handleNotificationClick(n.id, n.channel_id)}
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

        <div className="border-b border-[var(--border-color)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)] backdrop-blur-xl z-20">
          <div className="px-4 py-3 md:px-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {spotlightStats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/70 px-4 py-2 shadow-sm"
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[var(--text-muted)]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-[var(--text-primary)]">
                    {item.value}
                  </p>
                </div>
              ))}
              {activeChannel?.description && (
                <div className="max-w-xl rounded-2xl border border-blue-500/15 bg-blue-500/8 px-4 py-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.24em] text-blue-400/80">
                    Brief
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)] line-clamp-2">
                    {activeChannel.description}
                  </p>
                </div>
              )}
            </div>

            <div className="md:hidden flex items-center bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-[var(--bg-primary)] transition-all group w-full">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] group-focus-within:text-blue-500 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search messages..."
                className="bg-transparent border-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none ml-2 w-full font-medium"
                value={messageQuery}
                onChange={(e) => setMessageQuery(e.target.value)}
              />
              {messageQuery && (
                <button
                  onClick={() => setMessageQuery('')}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

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
              onTypingStart={() => broadcastTyping(false)}
              onTypingStop={() => broadcastTyping(true)}
              loading={isSending}
              disabled={!activeChannel || messagesLoading}
              activeChannelName={activeChannel?.name}
              isRestricted={isRestricted}
            />
          </div>

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
      <ProfileModal
        isOpen={isProfileModalOpen}
        user={user}
        onClose={() => setIsProfileModalOpen(false)}
        onUpdate={async () => {
          await refreshUser();
          addToast('Profile synced.', 'success');
        }}
      />
    </div>
  );
}
