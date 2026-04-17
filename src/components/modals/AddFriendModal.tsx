'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, LoaderCircle, Check, AtSign } from 'lucide-react';

type AddFriendModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (email: string) => Promise<void>;
};

export function AddFriendModal({ isOpen, onClose, onAdd }: AddFriendModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      await onAdd(email.trim());
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setEmail('');
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'User not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setEmail('');
    setError(null);
    setSent(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md glass p-8 rounded-[32px] border-[var(--border-color)] shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Add Friend</h2>
                <p className="text-sm text-[var(--text-muted)] font-medium mt-1">Invite someone to connect</p>
              </div>
              <button onClick={handleClose} className="p-2 rounded-xl hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="eyebrow ml-1">Their Email Address</label>
                <div className="relative group">
                  <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    placeholder="friend@example.com"
                    className="input-modern pl-12"
                    autoFocus
                  />
                </div>
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-[10px] text-red-500 font-black uppercase tracking-widest ml-1"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim() || sent}
                className={`btn-primary w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${sent ? '!bg-emerald-500 !shadow-emerald-500/20' : ''}`}
              >
                {loading ? (
                  <LoaderCircle className="w-6 h-6 animate-spin" />
                ) : sent ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Request Sent!</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    <span>Send Friend Request</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest text-center leading-relaxed">
                They&apos;ll receive a request and appear in your direct messages once they accept.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
