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
      label: 'Total Messages',
      value: messages.length,
      icon: <MessageCircle className="w-4 h-4 text-blue-400" />,
      color: 'from-blue-500/10 to-indigo-600/5',
      accent: 'blue',
    },
    {
      label: 'Contributors',
      value: uniqueAuthors,
      icon: <Users className="w-4 h-4 text-purple-400" />,
      color: 'from-purple-500/10 to-purple-600/5',
      accent: 'purple',
    },
    {
      label: 'Online Now',
      value: onlineUsers.length,
      icon: <Activity className="w-4 h-4 text-emerald-400" />,
      color: 'from-emerald-500/10 to-emerald-600/5',
      accent: 'emerald',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-3xl border-l border-white/5 transition-all">
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <span className="block text-xs font-bold text-white uppercase tracking-wider">
              Channel Insights
            </span>
            <span className="text-[10px] font-medium text-white/30 uppercase tracking-widest mt-0.5 block">
              Real-time analytics
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-white/30 hover:text-white transition-all hover:bg-white/5 rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
        <section>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-500 shadow-xl">
              <Hash className="w-8 h-8 opacity-50" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-white truncate">
                #{activeChannel?.name || 'General'}
              </h2>
              <p className="text-xs text-white/40 leading-relaxed mt-2 line-clamp-3">
                {activeChannel?.description || 'Welcome to this channel! No description provided.'}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <span className="h-px w-4 bg-white/10" />
            Stats
          </h3>
          <div className="grid gap-3">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`bg-gradient-to-br ${s.color} border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:border-white/20 transition-all group`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center">
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider">
                      {s.label}
                    </p>
                    <p className="text-2xl font-bold text-white tracking-tight">
                      {s.value}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-white/40 transition-all" />
              </motion.div>
            ))}
          </div>
        </section>

        {messages.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <span className="h-px w-4 bg-white/10" />
              Activity
            </h3>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
              <div className="flex items-end gap-1 h-12">
                {activityByHour.map((count, h) => (
                  <div
                    key={h}
                    className="flex-1 rounded-full relative group/bar"
                    style={{
                      height: `${Math.max((count / maxActivity) * 100, count > 0 ? 15 : 5)}%`,
                      backgroundColor: h === peakHour ? 'rgba(59,130,246,0.6)' : count > 0 ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-black border border-white/10 text-[8px] font-bold text-white opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                       {count} messages @ {formatHour(h)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-3 px-1">
                <span className="text-[8px] text-white/20 font-bold uppercase">00:00</span>
                <span className="text-[8px] text-white/20 font-bold uppercase">12:00</span>
                <span className="text-[8px] text-white/20 font-bold uppercase">23:59</span>
              </div>
            </div>
          </section>
        )}

        {topContributors.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <span className="h-px w-4 bg-white/10" />
              Top Contributors
            </h3>
            <div className="space-y-2">
              {topContributors.map(([userId, { username, count }], i) => (
                <div
                  key={userId}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-white/5 flex items-center justify-center text-[11px] font-bold text-blue-400">
                    {username[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {username}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / (topContributors[0]?.[1]?.count || 1)) * 100}%` }}
                          className="h-full bg-blue-500"
                        />
                      </div>
                      <span className="text-[9px] text-white/30 font-bold uppercase">
                        {count} msg
                      </span>
                    </div>
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-white/30">
                    #{i + 1}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="pt-4">
           <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                 <Shield className="w-4 h-4 text-emerald-400/60" />
                 <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Security Status</span>
              </div>
              <div className="space-y-2">
                 <div className="flex justify-between text-[9px] font-bold">
                    <span className="text-white/20 uppercase">Encryption</span>
                    <span className="flex items-center gap-1 text-emerald-400/80 uppercase">
                      <ShieldCheck className="w-3 h-3" />
                      Active
                    </span>
                 </div>
                 <div className="flex justify-between text-[9px] font-bold">
                    <span className="text-white/20 uppercase">Visibility</span>
                    <span className="text-blue-400/80 uppercase">Members Only</span>
                 </div>
                 <div className="flex justify-between text-[9px] font-bold">
                    <span className="text-white/20 uppercase">Peak Window</span>
                    <span className="text-white/60 uppercase">{formatHour(peakHour)}</span>
                 </div>
              </div>
           </div>
        </section>
      </div>

      <div className="p-6 border-t border-white/5 mt-auto">
        <div className="flex items-center gap-3 opacity-30">
          <Sparkles className="w-4 h-4" />
          <p className="text-[9px] font-bold uppercase tracking-widest">
            Nexus Insight Cluster
          </p>
        </div>
      </div>
    </div>
  );
}
