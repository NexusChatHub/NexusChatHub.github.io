'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, LoaderCircle, Smile, Mic, Paperclip, X, Bold, Italic, Code, Image as ImageIcon, FileText, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type MessageInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSendMessage: (content: string) => Promise<void> | void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  loading?: boolean;
  disabled?: boolean;
  activeChannelName?: string | null;
  isRestricted?: boolean;
};

const EMOJI_CATEGORIES = {
  'Smileys': ['😊', '😂', '🤣', '😍', '🤔', '😎', '🙃', '😅', '🥲', '😭', '🤯', '😤', '😴', '🥳', '🤩'],
  'Gestures': ['👍', '👎', '👏', '🙌', '🤝', '🫡', '✌️', '🤞', '🫶', '💪', '👋', '🙏'],
  'Objects': ['🔥', '✨', '💡', '🚀', '💯', '🎉', '⚡', '🌟', '💎', '🏆', '🎯', '🔑'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '❤️‍🔥', '💕', '💞'],
};

const COMPOSER_TOOLS = [
  {
    icon: ImageIcon,
    label: 'Image Link',
    snippet: '![Release visual](https://example.com/preview.png)',
  },
  {
    icon: FileText,
    label: 'Doc Link',
    snippet: '[Spec document](https://example.com/spec)',
  },
  {
    icon: Code,
    label: 'Code Block',
    snippet: '```ts\n// share code here\n```',
  },
];

const QUICK_INSERTS = [
  {
    label: 'Standup',
    snippet: '**Standup update**\n- Shipped:\n- Next:\n- Blockers:',
  },
  {
    label: 'Launch',
    snippet: '**Launch note**\nWhat changed:\n- \nImpact:\n- \nRollback:\n- ',
  },
  {
    label: 'Bug Triage',
    snippet: '**Bug triage**\nSeverity: \nOwner: \nStatus: \nNotes: ',
  },
];

const MAX_LENGTH_RESTRICTED = 200;

export function MessageInput({
  value,
  onChange,
  onSendMessage,
  onTypingStart,
  onTypingStop,
  loading = false,
  disabled = false,
  activeChannelName,
  isRestricted = false,
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState<keyof typeof EMOJI_CATEGORIES>('Smileys');
  const [isTyping, setIsTyping] = useState(false);

  const charCount = value.length;
  const charLimit = isRestricted ? MAX_LENGTH_RESTRICTED : null;
  const isOverLimit = charLimit ? charCount > charLimit : false;

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 200)}px`;
  }, [value]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      onTypingStop?.();
    };
  }, [onTypingStop]);

  const handleTextChange = (val: string) => {
    onChange(val);
    if (!isTyping && val.trim()) {
      setIsTyping(true);
      onTypingStart?.();
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTypingStop?.();
    }, 2000);
    if (!val.trim() && isTyping) {
      setIsTyping(false);
      onTypingStop?.();
    }
  };

  const submit = async () => {
    const nextValue = value.trim();
    if (!nextValue || loading || disabled || isOverLimit) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setIsTyping(false);
    onTypingStop?.();
    await onSendMessage(nextValue);
    setShowEmojis(false);
    setShowAttachments(false);
  };

  const addEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart ?? value.length;
      const end = textarea.selectionEnd ?? value.length;
      const newVal = value.slice(0, start) + emoji + value.slice(end);
      onChange(newVal);
      setTimeout(() => {
        textarea.selectionStart = start + emoji.length;
        textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      onChange(value + emoji);
    }
  };

  const insertSnippet = (snippet: string) => {
    const textarea = textareaRef.current;

    if (textarea) {
      const start = textarea.selectionStart ?? value.length;
      const end = textarea.selectionEnd ?? value.length;
      const prefix = value.slice(0, start);
      const suffix = value.slice(end);
      const needsLeadingBreak = prefix && !prefix.endsWith('\n') ? '\n' : '';
      const needsTrailingBreak = suffix && !suffix.startsWith('\n') ? '\n' : '';
      const nextValue = `${prefix}${needsLeadingBreak}${snippet}${needsTrailingBreak}${suffix}`;

      onChange(nextValue);
      setTimeout(() => {
        const cursorPosition = prefix.length + needsLeadingBreak.length + snippet.length;
        textarea.selectionStart = cursorPosition;
        textarea.selectionEnd = cursorPosition;
        textarea.focus();
      }, 0);
    } else {
      onChange(value ? `${value}\n${snippet}` : snippet);
    }

    setShowAttachments(false);
  };

  const insertFormatting = (syntax: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selected = value.slice(start, end);
    let newVal: string;
    let newCursor: number;

    if (syntax === 'bold') {
      newVal = value.slice(0, start) + `**${selected || 'bold text'}**` + value.slice(end);
      newCursor = selected ? start + newVal.length - value.length : start + 2;
    } else if (syntax === 'italic') {
      newVal = value.slice(0, start) + `_${selected || 'italic text'}_` + value.slice(end);
      newCursor = selected ? start + newVal.length - value.length : start + 1;
    } else {
      newVal = value.slice(0, start) + '```\n' + (selected || 'code') + '\n```' + value.slice(end);
      newCursor = selected ? start + newVal.length - value.length : start + 4;
    }

    onChange(newVal);
    setTimeout(() => {
      textarea.selectionStart = newCursor;
      textarea.selectionEnd = newCursor;
      textarea.focus();
    }, 0);
  };

  return (
    <div className="p-4 sm:p-6 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/95 to-transparent relative z-20">
      <div className="max-w-4xl mx-auto relative">
        <AnimatePresence>
          {showAttachments && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              className="absolute bottom-full mb-4 left-0 glass p-3 rounded-2xl border border-white/10 shadow-2xl z-50 flex gap-2"
            >
              {COMPOSER_TOOLS.map((item) => {
                const Icon = item.icon;
                return (
                <button
                  key={item.label}
                  onClick={() => insertSnippet(item.snippet)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/5 transition-all group"
                >
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5 text-blue-300" />
                  </div>
                  <span className="text-[10px] font-bold text-white/40 group-hover:text-white">
                    {item.label}
                  </span>
                </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showEmojis && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              className="absolute bottom-full mb-4 left-0 glass p-5 rounded-[24px] border border-white/10 shadow-2xl z-50 w-80"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-white/40">Emojis</span>
                <button onClick={() => setShowEmojis(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide pb-1">
                {(Object.keys(EMOJI_CATEGORIES) as Array<keyof typeof EMOJI_CATEGORIES>).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setEmojiCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap ${
                      emojiCategory === cat
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'bg-white/5 text-white/40 hover:bg-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-6 gap-2">
                {EMOJI_CATEGORIES[emojiCategory].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => addEmoji(emoji)}
                    className="text-xl p-2 hover:bg-white/5 rounded-xl transition-all active:scale-[0.85] leading-none grayscale-[0.5] hover:grayscale-0"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={`relative bg-black/40 backdrop-blur-3xl border rounded-[22px] shadow-2xl transition-all duration-300 overflow-hidden ${
            isOverLimit
              ? 'border-red-500/40'
              : 'border-white/10 focus-within:border-blue-500/40'
          } ${disabled ? 'opacity-50 grayscale pointer-events-none' : ''}`}
        >
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/5 bg-white/[0.02]">
             <div className="flex items-center gap-1 bg-black/20 rounded-lg p-0.5 border border-white/5">
                {[
                  { icon: <Bold className="w-3.5 h-3.5" />, action: 'bold' },
                  { icon: <Italic className="w-3.5 h-3.5" />, action: 'italic' },
                  { icon: <Code className="w-3.5 h-3.5" />, action: 'code' },
                ].map(({ icon, action }) => (
                  <button
                    key={action}
                    onClick={() => insertFormatting(action)}
                    className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all"
                  >
                    {icon}
                  </button>
                ))}
             </div>
             <div className="w-px h-5 bg-white/5 mx-2" />
             <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowAttachments(!showAttachments)}
                  className={`p-2 rounded-xl transition-all ${showAttachments ? 'bg-blue-600 text-white' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowEmojis(!showEmojis)}
                  className={`p-2 rounded-xl transition-all ${showEmojis ? 'bg-blue-600 text-white' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
                >
                  <Smile className="w-4 h-4" />
                </button>
             </div>
             {charLimit && (
              <div className="ml-auto flex items-center gap-2 px-2 py-1 rounded-lg bg-black/20 border border-white/5">
                <span className={`text-[10px] font-bold ${isOverLimit ? 'text-red-400' : 'text-white/30'}`}>
                  {charCount}/{charLimit}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col">
            {!value.trim() && !disabled && (
              <div className="flex flex-wrap gap-2 px-4 pt-4">
                {QUICK_INSERTS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => insertSnippet(item.snippet)}
                    className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/40 transition-all hover:border-blue-500/20 hover:bg-blue-500/10 hover:text-white"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            <textarea
              ref={textareaRef}
              rows={1}
              value={value}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void submit();
                }
              }}
              placeholder={disabled ? 'Disconnected...' : `Message #${activeChannelName || 'channel'}...`}
              className="w-full bg-transparent border-none px-6 py-4 text-[15px] text-white placeholder:text-white/20 focus:outline-none resize-none min-h-[60px] leading-relaxed font-medium"
            />

            <div className="flex items-center justify-between px-5 pb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-white/20">
                  <Mic className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Audio Off</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={disabled || loading || !value.trim() || isOverLimit}
                  className={`flex items-center justify-center gap-2 h-10 px-6 rounded-xl font-bold text-xs transition-all ${
                    !value.trim() || loading || disabled || isOverLimit
                      ? 'bg-white/5 text-white/20 border border-white/5'
                      : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 active:scale-95'
                  }`}
                >
                  {loading ? (
                    <LoaderCircle className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-6 mt-3 text-[10px] font-medium text-white/10 uppercase tracking-widest text-center">
          <div className="flex items-center gap-2">
            <Command className="w-3 h-3" />
            <span>Enter to send</span>
          </div>
          <div className="flex items-center gap-2">
            <Command className="w-3 h-3" />
            <span>Shift + Enter for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
}
