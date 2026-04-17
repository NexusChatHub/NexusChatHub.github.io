'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Hash,
  LogOut,
  Search,
  Layers,
  Plus,
  ChevronDown,
  Users,
  UserPlus,
  Moon,
  Sun,
  Compass,
  ShieldAlert,
  Settings,
  User,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import type { AppUser, Channel, Profile } from './types';
import { useTheme } from '@/hooks/useTheme';

type SidebarProps = {
  channels: Channel[];
  activeChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  user: AppUser | null;
  searchValue: string;
  onSearchChange: (value: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onCreateChannel: () => void;
  onAddFriend: () => void;
  onProfileClick: () => void;
  friends: Profile[];
};

export function Sidebar({
  channels,
  activeChannel,
  onSelectChannel,
  user,
  searchValue,
  onSearchChange,
  isOpen,
  onClose,
  onCreateChannel,
  onAddFriend,
  onProfileClick,
  friends = [],
}: SidebarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [channelsExpanded, setChannelsExpanded] = useState(true);
  const [dmsExpanded, setDmsExpanded] = useState(true);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { theme, mounted, toggleTheme } = useTheme();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const isRestricted = user?.user_metadata?.restricted === true;

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await supabase.auth.signOut();
  };

  if (!mounted) return <div className="w-[280px] bg-[var(--bg-primary)] hidden lg:block border-r border-white/5" />;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-[var(--bg-primary)]/80 backdrop-blur-3xl border-r border-white/5 transition-all duration-500 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-[20px_0_60px_-15px_rgba(0,0,0,0.5)]' : '-translate-x-full'
        }`}
      >
        <button
          onClick={onClose}
          className="lg:hidden absolute top-6 right-6 z-10 p-2.5 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group active:scale-95 cursor-pointer shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-[16px] bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-[0_4px_20px_rgba(59,130,246,0.5)] group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-black text-white tracking-tighter uppercase leading-none">
                  Nexus Chat
                </span>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                  <span className="block text-[8px] text-emerald-400 font-black uppercase tracking-[0.2em]">
                    Online
                  </span>
                </div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
          </div>
        </div>

        <div className="px-6 pt-6 pb-4 space-y-5">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-blue-400 transition-colors" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search channels..."
              className="w-full bg-black/30 border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-[10px] font-black uppercase tracking-[0.2em] text-white placeholder:text-white/15 focus:outline-none focus:border-blue-500/40 focus:bg-black/50 transition-all shadow-inner"
            />
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={onCreateChannel}
              disabled={isRestricted}
              className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-[9px] font-black uppercase tracking-[0.15em] text-blue-400 hover:bg-blue-600 hover:text-white transition-all active:scale-95 disabled:opacity-30 shadow-lg group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              New Channel
            </button>
            <button
              onClick={onAddFriend}
              className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-white/30 hover:text-white hover:bg-white/10 transition-all active:scale-95 shadow-lg relative group"
              title="Add Friend"
            >
              <UserPlus className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-2 scrollbar-hide py-2">
          <section>
            <button
              onClick={() => setChannelsExpanded((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 group hover:bg-white/5 rounded-xl transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Compass className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 group-hover:text-white transition-colors">
                  Channels ({channels.length})
                </span>
              </div>
              <ChevronRight
                className={`w-3.5 h-3.5 text-white/20 transition-transform duration-300 ${channelsExpanded ? 'rotate-90' : ''}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {channelsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1 mt-1 pb-4">
                    {channels.length > 0 ? (
                      channels.map((channel) => (
                        <ChannelItem
                          key={String(channel.id)}
                          channel={channel}
                          isActive={String(activeChannel?.id) === String(channel.id)}
                          onSelect={() => {
                            onSelectChannel(channel);
                            onClose();
                          }}
                        />
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center bg-white/5 rounded-3xl border border-dashed border-white/10 mx-2">
                        <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em]">
                          No channels found
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <section>
            <button
              onClick={() => setDmsExpanded((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 group hover:bg-white/5 rounded-xl transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 group-hover:text-white transition-colors">
                  Friends
                </span>
              </div>
              <ChevronRight
                className={`w-3.5 h-3.5 text-white/20 transition-transform duration-300 ${dmsExpanded ? 'rotate-90' : ''}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {dmsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1 mt-1">
                    {friends.length > 0 ? (
                      friends.map((friend) => (
                        <FriendItem key={friend.id} friend={friend} />
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center bg-white/5 rounded-3xl border border-dashed border-white/10 mx-2">
                        <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em]">
                          No friends yet
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>

        <div className="p-5 border-t border-white/5 bg-black/20" ref={userMenuRef}>
          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.9 }}
                transition={{ type: 'spring', damping: 20, stiffness: 250 }}
                className="absolute bottom-full left-4 right-4 mb-4 glass rounded-[24px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-50 p-2"
              >
                <div className="space-y-1">
                  <button 
                    onClick={() => { onProfileClick(); setUserMenuOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] text-white/60 hover:bg-white/5 hover:text-white transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-blue-400" />
                      Profile
                    </div>
                  </button>
                  <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] text-white/60 hover:bg-white/5 hover:text-white transition-all group">
                    <div className="flex items-center gap-3">
                      <Settings className="w-4 h-4 text-indigo-400" />
                      Settings
                    </div>
                  </button>
                  <button
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] text-white/60 hover:bg-white/5 hover:text-white transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      {theme === 'dark' ? <Sun className="w-4 h-4 text-orange-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
                      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </div>
                  </button>
                  <div className="h-px bg-white/5 my-2 mx-3" />
                  <button
                    onClick={() => void handleSignOut()}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] text-red-400 hover:bg-red-500/10 transition-all shadow-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className={`w-full flex items-center gap-3.5 p-3.5 rounded-[22px] border transition-all duration-300 group shadow-lg ${
              userMenuOpen ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5 hover:border-white/20'
            }`}
          >
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-[14px] bg-gradient-to-tr from-blue-500/20 via-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-blue-400 font-black text-sm group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-inner">
                {displayName[0].toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-[3.5px] border-[#0a0a0a] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-black uppercase tracking-tighter text-white truncate">
                  {displayName}
                </p>
                {isRestricted && <ShieldAlert className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 shadow-lg" />}
              </div>
              <p className="text-[9px] text-emerald-400/80 font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
                 <Sparkles className="w-2.5 h-2.5" />
                 Active
              </p>
            </div>
            <div className={`transition-transform duration-500 ${userMenuOpen ? 'rotate-180' : ''}`}>
               <ChevronDown className="w-4 h-4 text-white/20 group-hover:text-white/60" />
            </div>
          </button>
        </div>
      </aside>
    </>
  );
}

function ChannelItem({ channel, isActive, onSelect }: { channel: Channel; isActive: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full group flex items-center gap-3.5 px-5 py-3 rounded-2xl transition-all duration-300 active:scale-[0.98] relative ${
        isActive
          ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
          : 'border border-transparent text-white/40 hover:bg-white/5 hover:text-white/80'
      }`}
    >
      <div className={`p-1.5 rounded-lg transition-all duration-300 ${isActive ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-white/5 group-hover:bg-white/10'}`}>
        <Hash className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-inherit'}`} />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className={`text-[11px] font-black uppercase tracking-[0.1em] truncate ${isActive ? 'text-white' : ''}`}>
          {channel.name}
        </p>
        {channel.description && (
          <p className="text-[8px] truncate font-bold mt-1 uppercase tracking-widest opacity-40 group-hover:opacity-70 transition-opacity">
            {channel.description}
          </p>
        )}
      </div>
      {isActive && (
        <div className="w-1 h-4 rounded-full bg-blue-500 absolute left-0" />
      )}
    </button>
  );
}

function FriendItem({ friend }: { friend: Profile }) {
  return (
    <button className="w-full group flex items-center gap-3.5 px-5 py-3 rounded-2xl border border-transparent hover:bg-white/5 transition-all duration-300 active:scale-[0.98]">
      <div className="relative flex-shrink-0">
        <div className="w-9 h-9 rounded-[12px] bg-gradient-to-tr from-white/5 to-white/10 border border-white/10 flex items-center justify-center text-white/60 font-black text-xs shadow-inner group-hover:border-purple-500/40 group-hover:text-white transition-all">
          {(friend.username?.[0] || 'U').toUpperCase()}
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-[3px] border-[#0a0a0a] shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-[11px] font-black uppercase tracking-[0.1em] text-white/40 group-hover:text-white truncate transition-colors">
          {friend.username || 'Anonymous'}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
           <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
           <p className="text-[8px] text-emerald-400/60 font-black uppercase tracking-widest group-hover:text-emerald-400 transition-colors">
             Online
           </p>
        </div>
      </div>
    </button>
  );
}
