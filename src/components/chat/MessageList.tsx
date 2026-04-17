'use client';

import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SearchX,
  Hash,
  Sparkles,
  MoreHorizontal,
  Ban,
  MicOff,
  Flag,
  Edit3,
  Trash2,
  Check,
  Copy,
  ChevronDown,
  SmilePlus,
  Clock,
  Shield,
} from 'lucide-react';
import type { Message, UserRole, EntityId, TypingUser } from './types';

type MessageWithReactions = Message & {
  reactions?: Array<{ emoji: string; count: number; user_reacted: boolean }>;
};

type MessageListProps = {
  messages: MessageWithReactions[];
  searchQuery: string;
  channelName?: string | null;
  channelDescription?: string | null;
  currentUserId?: string;
  loading?: boolean;
  currentUserRole?: UserRole;
  typingUsers?: TypingUser[];
  onDeleteMessage?: (id: EntityId) => Promise<void>;
  onEditMessage?: (id: EntityId, content: string) => Promise<void>;
  onToggleReaction?: (id: EntityId, emoji: string) => Promise<void>;
};

const QUICK_REACTIONS = ['👍', '❤️', '🔥', '😂', '🚀', '👀'];
const ALL_REACTIONS = ['👍', '❤️', '🔥', '😂', '🚀', '👀', '✨', '🎉', '🤔', '💯', '😎', '🙌'];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderMessageContent(content: string, searchQuery: string) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return parts.map((part, i) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const fullCode = part.slice(3, -3).trim();
      const firstLineBreak = fullCode.indexOf('\n');
      const lang = firstLineBreak !== -1 ? fullCode.slice(0, firstLineBreak).toLowerCase() : '';
      const code = firstLineBreak !== -1 ? fullCode.slice(firstLineBreak + 1) : fullCode;

      return (
        <div key={i} className="my-4 group/code relative">
          <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-x border-t border-white/10 rounded-t-xl">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/80">
              {lang || 'code intelligence'}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(code)}
              className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all opacity-0 group-hover/code:opacity-100"
              title="Copy Snippet"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <pre className="p-4 bg-black/40 border border-white/10 rounded-b-xl overflow-x-auto font-mono text-sm text-blue-200/90 whitespace-pre scrollbar-hide">
            <code>{code}</code>
          </pre>
        </div>
      );
    }

    let processed: (string | React.ReactElement)[] = [part];

    // Inline code
    processed = processed.flatMap((p, j) => {
      if (typeof p !== 'string') return [p];
      return p.split(/(`[^`]+`)/g).map((bit, k) => {
        if (bit.startsWith('`') && bit.endsWith('`')) {
          return (
            <code key={`${j}-${k}`} className="bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded text-blue-300 font-mono text-[12px]">
              {bit.slice(1, -1)}
            </code>
          );
        }
        return bit;
      });
    });

    // Bold
    processed = processed.flatMap((p, j) => {
      if (typeof p !== 'string') return [p];
      return p.split(/(\*\*[^*]+\*\*)/g).map((bit, k) => {
        if (bit.startsWith('**') && bit.endsWith('**')) {
          return <strong key={`${j}-${k}`} className="font-black text-white">{bit.slice(2, -2)}</strong>;
        }
        return bit;
      });
    });

    // Italic
    processed = processed.flatMap((p, j) => {
      if (typeof p !== 'string') return [p];
      return p.split(/(_[^_]+_)/g).map((bit, k) => {
        if (bit.startsWith('_') && bit.endsWith('_')) {
          return <em key={`${j}-${k}`} className="italic opacity-80 text-blue-100/90">{bit.slice(1, -1)}</em>;
        }
        return bit;
      });
    });

    // Search highlighting
    if (searchQuery.trim()) {
      processed = processed.flatMap((p, j) => {
        if (typeof p !== 'string') return [p];
        return p.split(new RegExp(`(${escapeRegExp(searchQuery)})`, 'ig')).map((bit, k) => {
          if (bit.toLowerCase() === searchQuery.toLowerCase()) {
            return (
              <mark key={`${j}-${k}`} className="bg-blue-400 text-black font-black rounded-sm px-0.5">
                {bit}
              </mark>
            );
          }
          return bit;
        });
      });
    }

    return <span key={i} className="leading-relaxed">{processed}</span>;
  });
}

function isSameDay(d1: string, d2: string) {
  const a = new Date(d1);
  const b = new Date(d2);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDateDivider(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(dateString, today.toISOString())) return 'Current Cycle';
  if (isSameDay(dateString, yesterday.toISOString())) return 'Previous Cycle';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
}

export function MessageList({
  messages,
  searchQuery,
  channelName,
  channelDescription,
  currentUserId,
  loading = false,
  currentUserRole = 'member',
  typingUsers = [],
  onDeleteMessage,
  onEditMessage,
  onToggleReaction,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeReactionPicker, setActiveReactionPicker] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<EntityId | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowJumpToBottom(distFromBottom > 400);
    };
    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    if (!scrollRef.current || searchQuery.trim()) return;
    const el = scrollRef.current;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distFromBottom < 600) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, searchQuery]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowJumpToBottom(false);
  }, []);

  const groupedMessages = useMemo(() => {
    return messages.map((m, i) => {
      const prev = messages[i - 1];
      const isFirstInGroup =
        !prev || prev.user_id !== m.user_id || !isSameDay(prev.created_at, m.created_at);
      const showDivider = !prev || !isSameDay(prev.created_at, m.created_at);
      return { ...m, isFirstInGroup, showDivider };
    });
  }, [messages]);

  const canModerate = currentUserRole === 'creator' || currentUserRole === 'mod';

  const startEditing = (message: Message) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
    setActiveMenu(null);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const saveEdit = async (id: EntityId) => {
    if (!editContent.trim() || !onEditMessage) return;
    await onEditMessage(id, editContent.trim());
    setEditingMessageId(null);
    setEditContent('');
  };

  const copyMessage = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
    setActiveMenu(null);
  };

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-8 scrollbar-hide scroll-smooth relative z-10">
      <div className="max-w-4xl mx-auto w-full">
        {loading ? (
          <div className="space-y-12 mt-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-6 animate-pulse">
                <div className="w-12 h-12 rounded-[20px] bg-white/5 flex-shrink-0 border border-white/5" />
                <div className="flex-1 space-y-4">
                  <div className="h-3 w-40 bg-white/5 rounded-lg" />
                  <div className="h-24 w-full bg-white/5 rounded-[24px] border border-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-indigo-500/10 flex items-center justify-center mb-10 border border-white/10 shadow-2xl relative group"
            >
              <div className="absolute inset-0 bg-blue-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              {searchQuery ? (
                <SearchX className="w-16 h-12 text-white/20" />
              ) : (
                <div className="relative">
                  <Hash className="w-14 h-14 text-blue-500/80" />
                  <Sparkles className="w-8 h-8 text-blue-400 absolute -top-4 -right-4 animate-pulse" />
                </div>
              )}
            </motion.div>
            <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase leading-none">
              {searchQuery ? 'Zero Intelligence' : `Frequency #${channelName || 'ROOT'}`}
            </h2>
            <p className="text-white/40 max-w-sm leading-relaxed font-bold uppercase tracking-[0.1em] text-[10px]">
              {searchQuery
                ? `No signals matching "${searchQuery}" detected in this sector.`
                : channelDescription ||
                  'The beginning of a legendary transmission. Establish frequency now.'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence initial={false}>
              {groupedMessages.map((message) => {
                const isOwn = currentUserId === message.user_id;
                const author = message.profiles?.username || 'Operator';
                const time = new Date(message.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div key={String(message.id)} className="space-y-0 relative">
                    {message.showDivider && (
                      <div className="flex items-center gap-6 py-12">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <div className="flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-white/10 shadow-lg backdrop-blur-sm">
                           <Clock className="w-3 h-3 text-white/20" />
                           <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">
                             {formatDateDivider(message.created_at)}
                           </span>
                        </div>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      </div>
                    )}

                    <motion.div
                      initial={{ opacity: 0, x: isOwn ? 10 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex gap-4 group px-4 py-1.5 rounded-3xl hover:bg-white/[0.02] relative transition-all duration-300 ${
                        isOwn ? 'flex-row-reverse' : 'flex-row'
                      } ${message.isFirstInGroup ? 'mt-6' : ''}`}
                    >
                      {/* Avatar with Status */}
                      <div className="w-12 flex-shrink-0 pt-1">
                        {message.isFirstInGroup && (
                          <div className="relative group/avatar">
                            <div
                              className={`w-12 h-12 rounded-[18px] flex items-center justify-center text-sm font-black border transition-all duration-500 group-hover/avatar:scale-110 shadow-2xl ${
                                isOwn
                                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                  : 'bg-white/5 border-white/10 text-white/60'
                              }`}
                            >
                              {author[0].toUpperCase()}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-[3.5px] border-[#0a0a0a] shadow-lg" />
                          </div>
                        )}
                      </div>

                      <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                        {message.isFirstInGroup && (
                          <div className={`flex items-center gap-3 mb-2 px-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                            <span className="text-[11px] font-black text-white tracking-tighter uppercase flex items-center gap-2">
                               {author}
                               {message.user_id === currentUserId && <Shield className="w-2.5 h-2.5 text-blue-500/60" />}
                            </span>
                            <span className="text-[9px] text-white/20 font-black uppercase tracking-widest">{time}</span>
                          </div>
                        )}

                        <div className={`relative flex items-start group/bubble gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                          {editingMessageId === message.id ? (
                            <div className="w-full min-w-[320px] max-w-xl bg-black/60 backdrop-blur-3xl rounded-[28px] border border-blue-500/40 p-4 shadow-3xl">
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full bg-transparent border-none p-0 text-[15px] text-white focus:outline-none resize-none min-h-[80px] leading-relaxed font-medium"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    void saveEdit(message.id);
                                  }
                                  if (e.key === 'Escape') cancelEditing();
                                }}
                              />
                              <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-2">
                                <button
                                  onClick={cancelEditing}
                                  className="px-4 py-2 rounded-xl text-white/40 hover:bg-white/5 transition-all text-[9px] font-black uppercase tracking-[0.2em]"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => void saveEdit(message.id)}
                                  className="px-5 py-2 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition-all text-[9px] font-black uppercase tracking-[0.2em] active:scale-95"
                                >
                                  Update
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-inherit">
                              <div
                                className={`px-5 py-3.5 rounded-[24px] text-[15px] leading-relaxed border transition-all duration-500 shadow-2xl relative group-hover/bubble:shadow-blue-500/5 ${
                                  isOwn
                                    ? 'bg-gradient-to-br from-blue-600/90 to-indigo-700/90 border-blue-400/20 text-white rounded-tr-sm'
                                    : 'bg-white/5 border-white/5 text-blue-50/90 rounded-tl-sm hover:bg-white/[0.08] hover:border-white/10'
                                }`}
                              >
                                {renderMessageContent(message.content, searchQuery)}
                                {message.edited_at && (
                                  <div className="mt-2 flex items-center gap-1.5 opacity-30">
                                     <div className="w-1 h-1 rounded-full bg-white" />
                                     <span className="text-[8px] font-black uppercase tracking-widest">Edited Intelligence</span>
                                  </div>
                                )}
                              </div>

                              {/* reactions summary */}
                              {message.reactions && message.reactions.length > 0 && (
                                <div className={`flex flex-wrap gap-1.5 mt-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                  {message.reactions.map((r) => (
                                    <button
                                      key={r.emoji}
                                      onClick={() => onToggleReaction?.(message.id, r.emoji)}
                                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border transition-all active:scale-90 ${
                                        r.user_reacted
                                          ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                                          : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'
                                      }`}
                                    >
                                      <span className="text-sm scale-110">{r.emoji}</span>
                                      <span className="font-black text-[10px] tracking-tighter">{r.count}</span>
                                    </button>
                                  ))}
                                  <button
                                    onClick={() => setActiveReactionPicker(activeReactionPicker === String(message.id) ? null : String(message.id))}
                                    className="p-1.5 rounded-xl border border-dashed border-white/10 text-white/20 hover:text-white/60 hover:border-white/20 transition-all active:scale-90 bg-white/5"
                                  >
                                    <SmilePlus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* hover action control */}
                          {!editingMessageId && (
                            <div className={`flex items-center gap-1.5 opacity-0 group-hover/bubble:opacity-100 transition-all duration-300 self-center ${isOwn ? 'mr-1' : 'ml-1'}`}>
                               <div className="flex bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-1">
                                  {QUICK_REACTIONS.slice(0, 4).map(emoji => (
                                    <button
                                      key={emoji}
                                      onClick={() => onToggleReaction?.(message.id, emoji)}
                                      className="p-2 hover:bg-white/5 transition-all active:scale-75 text-base leading-none grayscale-[0.3] hover:grayscale-0"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                  <div className="w-px h-4 bg-white/10 self-center mx-1" />
                                  <button
                                    onClick={() => setActiveMenu(activeMenu === String(message.id) ? null : String(message.id))}
                                    className={`p-2 rounded-xl transition-all active:scale-90 ${activeMenu === String(message.id) ? 'bg-blue-500 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                               </div>
                            </div>
                          )}

                          {/* Reaction Picker Overlay */}
                          <AnimatePresence>
                             {activeReactionPicker === String(message.id) && (
                               <motion.div
                                 initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                 animate={{ opacity: 1, scale: 1, y: 0 }}
                                 exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                 className={`absolute z-50 bottom-full mb-3 glass p-4 rounded-[28px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${isOwn ? 'right-0' : 'left-0'}`}
                               >
                                  <div className="grid grid-cols-6 gap-2">
                                     {ALL_REACTIONS.map(emoji => (
                                       <button
                                         key={emoji}
                                         onClick={() => {
                                           onToggleReaction?.(message.id, emoji);
                                           setActiveReactionPicker(null);
                                         }}
                                         className="p-2.5 hover:bg-white/5 rounded-xl transition-all active:scale-[0.8] text-lg grayscale-[0.2] hover:grayscale-0"
                                       >
                                         {emoji}
                                       </button>
                                     ))}
                                  </div>
                               </motion.div>
                             )}
                          </AnimatePresence>

                          {/* Context Menu Overlay */}
                          <AnimatePresence>
                            {activeMenu === String(message.id) && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, x: isOwn ? -10 : 10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`absolute z-50 top-0 glass p-2 rounded-[24px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-56 ${
                                  isOwn ? 'right-full mr-4' : 'left-full ml-4'
                                }`}
                              >
                                <button
                                  onClick={() => void copyMessage(message.content, String(message.id))}
                                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white/5 hover:text-white transition-all group"
                                >
                                  <div className="flex items-center gap-3">
                                    {copiedId === String(message.id) ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                    {copiedId === String(message.id) ? 'Signals Copied' : 'Copy signal'}
                                  </div>
                                </button>

                                {isOwn && (
                                  <button
                                    onClick={() => startEditing(message)}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white/5 hover:text-white transition-all"
                                  >
                                    <Edit3 className="w-4 h-4 text-blue-400" />
                                    Adjust Signal
                                  </button>
                                )}

                                <div className="h-px bg-white/5 my-2 mx-3" />
                                
                                {canModerate && !isOwn && (
                                  <>
                                    <p className="px-4 py-2 text-[8px] font-black uppercase tracking-[0.25em] text-white/20">Administration</p>
                                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-orange-400 hover:bg-orange-500/10 transition-all">
                                      <MicOff className="w-4 h-4" />
                                      Silence Node
                                    </button>
                                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all">
                                      <Ban className="w-4 h-4" />
                                      Banish Node
                                    </button>
                                    <div className="h-px bg-white/5 my-2 mx-3" />
                                  </>
                                )}

                                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/30 hover:bg-white/5 hover:text-white/60 transition-all">
                                  <Flag className="w-4 h-4" />
                                  Report Violation
                                </button>

                                {(isOwn || canModerate) && (
                                  <>
                                    <div className="h-px bg-white/5 my-2 mx-3" />
                                    <button
                                      onClick={() => {
                                        void onDeleteMessage?.(message.id);
                                        setActiveMenu(null);
                                      }}
                                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Terminate signal
                                    </button>
                                  </>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Typing indicator */}
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-4 px-6 mt-8 mb-4 py-3 rounded-2xl bg-white/[0.02] border border-white/5 w-fit"
            >
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '200ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-bounce" style={{ animationDelay: '400ms' }} />
              </div>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">
                <span className="text-blue-400">{typingUsers.map((u) => u.username).join(', ')}</span>
                {' '}{typingUsers.length === 1 ? 'is establishes connection' : 'are establishing frequency'}...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} className="h-12" />
      </div>

      {/* Overlays Close */}
      {(activeMenu || activeReactionPicker) && (
        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => { setActiveMenu(null); setActiveReactionPicker(null); }} />
      )}

      {/* Jump Control */}
      <AnimatePresence>
        {showJumpToBottom && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToBottom}
            className="fixed bottom-40 right-10 z-30 flex items-center gap-3 px-6 py-3.5 bg-blue-600 text-white rounded-[22px] shadow-[0_15px_40px_rgba(37,99,235,0.4)] border border-blue-400/20 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-500 hover:-translate-y-1 active:scale-95 transition-all group"
          >
            <ChevronDown className="w-4 h-4 group-hover:animate-bounce" />
            Establish Latest Signal
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
