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
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    element.style.height = '0px';
    element.style.height = `${Math.min(element.scrollHeight, 240)}px`;
  }, [value]);

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
    <div className="p-4 sm:p-8 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/90 to-transparent relative z-20">
      <div className="max-w-4xl mx-auto relative">
        {/* Attachment Menu */}
        <AnimatePresence>
          {showAttachments && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              className="absolute bottom-full mb-4 left-0 glass p-3 rounded-[24px] border border-white/10 shadow-2xl z-50 flex gap-2"
            >
              {[
                { icon: <ImageIcon className="w-5 h-5 text-blue-400" />, label: 'Image' },
                { icon: <FileText className="w-5 h-5 text-purple-400" />, label: 'Document' },
                { icon: <Code className="w-5 h-5 text-emerald-400" />, label: 'Snippet' },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowAttachments(false);
                  }}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-white/5 transition-all group"
                >
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform shadow-lg">
                    {item.icon}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
                    {item.label}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Emoji Picker */}
        <AnimatePresence>
          {showEmojis && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              className="absolute bottom-full mb-4 left-0 glass p-5 rounded-[32px] border border-white/10 shadow-2xl z-50 w-80"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Emoji Intel</span>
                <button onClick={() => setShowEmojis(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide pb-1">
                {(Object.keys(EMOJI_CATEGORIES) as Array<keyof typeof EMOJI_CATEGORIES>).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setEmojiCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
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

        <input ref={fileInputRef} type="file" className="hidden" />

        {/* Outer Container Glow */}
        <div className={`absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-[28px] blur-2xl transition-opacity duration-1000 pointer-events-none ${isTyping || loading ? 'opacity-100 animate-pulse' : 'opacity-0'}`} />

        <div
          className={`relative bg-black/40 backdrop-blur-3xl border rounded-[26px] shadow-2xl transition-all duration-500 overflow-hidden ${
            isOverLimit
              ? 'border-red-500/40'
              : 'border-white/10 focus-within:border-blue-500/40'
          } ${disabled ? 'opacity-30 grayscale pointer-events-none' : ''}`}
        >
          {/* Top Tools */}
          <div className="flex items-center gap-1.5 px-5 py-3 border-b border-white/5 bg-white/5">
             <div className="flex items-center gap-1 bg-black/20 rounded-xl p-1 border border-white/5 shadow-inner">
                {[
                  { icon: <Bold className="w-3.5 h-3.5" />, action: 'bold' },
                  { icon: <Italic className="w-3.5 h-3.5" />, action: 'italic' },
                  { icon: <Code className="w-3.5 h-3.5" />, action: 'code' },
                ].map(({ icon, action }) => (
                  <button
                    key={action}
                    onClick={() => insertFormatting(action)}
                    className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                  >
                    {icon}
                  </button>
                ))}
             </div>
             <div className="w-px h-6 bg-white/5 mx-2" />
             <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAttachments(!showAttachments)}
                  className={`p-2 rounded-xl transition-all active:scale-95 ${showAttachments ? 'bg-blue-600 text-white' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowEmojis(!showEmojis)}
                  className={`p-2 rounded-xl transition-all active:scale-95 ${showEmojis ? 'bg-blue-600 text-white' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
                >
                  <Smile className="w-4 h-4" />
                </button>
             </div>
             {charLimit && (
              <div className="ml-auto flex items-center gap-2 px-3 py-1 rounded-lg bg-black/20 border border-white/5">
                <div className={`w-1.5 h-1.5 rounded-full ${isOverLimit ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-blue-500'}`} />
                <span className={`text-[9px] font-black uppercase tracking-widest ${isOverLimit ? 'text-red-400' : 'text-white/40'}`}>
                  {charCount}/{charLimit}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col">
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
              placeholder={disabled ? 'SIGNAL OFFLINE...' : `ESTABLISH FREQUENCY IN #${activeChannelName || 'WORKSPACE'}...`}
              className="w-full bg-transparent border-none px-7 py-5 text-[15px] text-white placeholder:text-white/10 focus:outline-none resize-none min-h-[70px] leading-relaxed font-medium"
            />

            <div className="flex items-center justify-between px-6 pb-5">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 group cursor-pointer active:scale-95 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white/30 group-hover:text-white/60 transition-colors">
                    <Mic className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-white/40 transition-colors">Audio Off</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <AnimatePresence>
                  {value.trim() && !isOverLimit && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="hidden sm:flex items-center gap-2"
                    >
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Ready to transmit</span>
                      <div className="px-2 py-1 rounded bg-white/5 border border-white/10">
                        <span className="text-[8px] font-black text-white/40 uppercase">ENTER</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={disabled || loading || !value.trim() || isOverLimit}
                  className={`relative group flex items-center justify-center gap-2 h-11 px-8 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-500 overflow-hidden shadow-2xl ${
                    !value.trim() || loading || disabled || isOverLimit
                      ? 'bg-white/5 text-white/20 border border-white/5'
                      : 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white border border-blue-400/40 hover:scale-105 active:scale-95 shadow-blue-500/25'
                  }`}
                >
                  {loading ? (
                    <LoaderCircle className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className={`w-4 h-4 transition-transform duration-500 ${value.trim() ? 'translate-x-1 -translate-y-1' : ''}`} />
                      <span>Transmit</span>
                    </>
                  )}
                  {/* Internal Glow */}
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Global Keybinds Hint */}
        <div className="flex justify-center gap-8 mt-4">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
              <span className="text-[8px] font-black uppercase tracking-[0.25em] text-white/20">Secure Link Active</span>
           </div>
           <div className="flex items-center gap-2">
              <Command className="w-2.5 h-2.5 text-white/20" />
              <span className="text-[8px] font-black uppercase tracking-[0.25em] text-white/20">Shift + Enter New Line</span>
           </div>
        </div>
      </div>
    </div>
  );
}
