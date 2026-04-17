'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Hash,
  Shield,
  MessageCircle,
  Activity,
  ChevronRight,
  Sparkles,
  X,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import type { Channel, Message, PresenceUser } from './types';

type ChatInsightsProps = {
  activeChannel: Channel | null;
  messages: Message[];
  onlineUsers: PresenceUser[];
  isOpen: boolean;
  onClose: () => void;
};

export function ChatInsights({ activeChannel, messages, onlineUsers, onClose }: ChatInsightsProps) {
  const uniqueAuthors = new Set(messages.map((m) => m.user_id)).size;

  // Messages by hour for activity sparkline
  const activityByHour = useMemo(() => {
    const counts = new Array(24).fill(0);
    messages.forEach((m) => {
      const hour = new Date(m.created_at).getHours();
      counts[hour]++;
    });
    return counts;
  }, [messages]);

  const peakHour = activityByHour.indexOf(Math.max(...activityByHour));
  const formatHour = (h: number) => {
    if (h === 0) return '12am';
    if (h < 12) return `${h}am`;
    if (h === 12) return '12pm';
    return `${h - 12}pm`;
  };

  // Most active contributors
  const topContributors = useMemo(() => {
    const counts: Record<string, { count: number; username: string }> = {};
    messages.forEach((m) => {
      const userId = m.user_id;
      const username = m.profiles?.username || 'Unknown';
      if (!counts[userId]) counts[userId] = { count: 0, username };
      counts[userId].count++;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3);
  }, [messages]);

  const maxActivity = Math.max(...activityByHour, 1);

  const stats = [
    {
      label: 'Signals',
      value: messages.length,
      icon: <MessageCircle className="w-4 h-4" />,
      color: 'from-blue-500/10 to-indigo-600/5',
      accent: 'blue',
    },
    {
      label: 'Nodes',
      value: uniqueAuthors,
      icon: <Users className="w-4 h-4" />,
      color: 'from-purple-500/10 to-purple-600/5',
      accent: 'purple',
    },
    {
      label: 'Active',
      value: onlineUsers.length,
      icon: <Activity className="w-4 h-4" />,
      color: 'from-emerald-500/10 to-emerald-600/5',
      accent: 'emerald',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-3xl transition-all duration-500 border-l border-white/5">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-lg">
            <Zap className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <span className="block text-[11px] font-black text-white uppercase tracking-[0.25em] leading-none">
              Frequency Intel
            </span>
            <span className="text-[8px] font-black text-blue-400/60 uppercase tracking-widest mt-1.5 block">
              Node Identification: 0X4F21
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2.5 text-white/30 hover:text-white transition-all hover:bg-white/5 rounded-2xl active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
        {/* Frequency Identity */}
        <section>
          <div className="flex items-start gap-5">
            <div className="relative flex-shrink-0 group">
              <div className="w-20 h-20 rounded-[32px] bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/10 flex items-center justify-center text-blue-500 shadow-2xl transition-transform duration-500 group-hover:scale-105">
                <Hash className="w-10 h-10 text-blue-500/80" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-2xl bg-[#0a0a0a] border border-white/10 flex items-center justify-center shadow-2xl">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
            <div className="min-w-0 pt-1">
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase truncate leading-none">
                #{activeChannel?.name || 'ROOT'}
              </h2>
              <p className="text-[10px] text-white/40 leading-relaxed font-black uppercase tracking-widest mt-3">
                {activeChannel?.description ||
                  'High-performance coordination frequency established for elite tactical operations.'}
              </p>
            </div>
          </div>
        </section>

        {/* Analytics Grid */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
             <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
             <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">Analytics</span>
          </div>
          
          <div className="grid gap-3">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`bg-gradient-to-br ${s.color} border border-white/5 p-5 rounded-[24px] flex items-center justify-between hover:border-white/20 hover:bg-white/[0.04] transition-all group cursor-default shadow-xl relative overflow-hidden`}
              >
                <div className="flex items-center gap-5 relative z-10">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500`}
                  >
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">
                      {s.label}
                    </p>
                    <p className="text-3xl font-black text-white tracking-tighter leading-none">
                      {s.value}
                    </p>
                  </div>
                </div>
                <div className={`absolute top-0 right-0 w-24 h-24 bg-${s.accent}-500/5 blur-3xl rounded-full`} />
                <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-white/40 group-hover:translate-x-1 transition-all" />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Pulse Visualization */}
        {messages.length > 0 && (
          <section className="space-y-4">
             <div className="flex items-center gap-3 mb-6">
               <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
               <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">Signal Pulse</span>
            </div>
            
            <div className="bg-white/[0.02] border border-white/5 rounded-[28px] p-6 shadow-2xl">
              <div className="flex items-end gap-1 h-16">
                {activityByHour.map((count, h) => (
                  <motion.div
                    key={h}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max((count / maxActivity) * 100, count > 0 ? 12 : 4)}%` }}
                    className="flex-1 rounded-full transition-all group/bar relative"
                    style={{
                      backgroundColor:
                        h === peakHour
                          ? 'rgba(59,130,246,0.8)'
                          : count > 0
                          ? 'rgba(59,130,246,0.2)'
                          : 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg bg-black border border-white/10 text-[8px] font-black text-white opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                       {count} SIGNALS @ {formatHour(h)}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="flex justify-between mt-4">
                <span className="text-[8px] text-white/20 font-black tracking-widest uppercase">00:00</span>
                <span className="text-[8px] text-white/20 font-black tracking-widest uppercase">12:00</span>
                <span className="text-[8px] text-white/20 font-black tracking-widest uppercase">23:59</span>
              </div>
            </div>
          </section>
        )}

        {/* Elite Contributors */}
        {topContributors.length > 0 && (
          <section className="space-y-5">
            <div className="flex items-center gap-3 mb-6">
               <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
               <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">Elite Nodes</span>
            </div>
            
            <div className="space-y-2">
              {topContributors.map(([userId, { username, count }], i) => (
                <div
                  key={userId}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] hover:border-white/10 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-white/5 flex items-center justify-center text-[10px] font-black text-blue-400 group-hover:scale-110 transition-transform">
                    {username[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-white truncate uppercase tracking-[0.1em]">
                      {username}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex-1 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / (topContributors[0]?.[1]?.count || 1)) * 100}%` }}
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                        />
                      </div>
                      <span className="text-[9px] text-white/30 font-black uppercase tracking-widest">
                        {count} SIG
                      </span>
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center text-[8px] font-black text-white/20 group-hover:text-blue-400 transition-colors">
                    #{i + 1}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Security Log */}
        <section className="pt-10 space-y-4">
           <div className="bg-white/5 rounded-[24px] p-6 border border-white/10 relative overflow-hidden group">
              <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Security Protocol</span>
                 </div>
                 <div className="space-y-3">
                    <div className="flex justify-between items-center text-[9px] font-black">
                       <span className="text-white/30 uppercase">Status</span>
                       <span className="text-emerald-400 uppercase tracking-widest">Active Link</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-black">
                       <span className="text-white/30 uppercase">Encryption</span>
                       <span className="text-blue-400 uppercase tracking-widest">Quantum-V2</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-black">
                       <span className="text-white/30 uppercase">Visibility</span>
                       <span className="text-white/60 uppercase tracking-widest">Authorized Only</span>
                    </div>
                 </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/10 transition-all duration-1000" />
           </div>
        </section>
      </div>

      {/* Footer Identity */}
      <div className="p-8 bg-black/40 border-t border-white/5 mt-auto">
        <div className="flex items-center gap-4 group">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/10 flex items-center justify-center group-hover:border-blue-500/40 transition-colors">
            <Sparkles className="w-4 h-4 text-white/20 group-hover:text-blue-400 transition-all" />
          </div>
          <div>
            <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] group-hover:text-blue-400 transition-colors">
              Nexus Intelligence
            </p>
            <p className="text-[8px] text-white/20 font-black uppercase tracking-widest mt-1">
              Cluster Sync · Established
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
