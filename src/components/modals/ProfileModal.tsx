'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Camera, Shield, Check, Loader2, LogOut, Mail, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { AppUser } from '@/components/chat/types';

type ProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: AppUser | null;
  onUpdate: () => Promise<void> | void;
};

export function ProfileModal({ isOpen, onClose, user, onUpdate }: ProfileModalProps) {
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setUsername(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
      setAvatarUrl(user.user_metadata?.avatar_url || '');
    }
    setError(null);
    setSuccess(false);
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !username.trim()) return;
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { 
          full_name: username.trim(),
          avatar_url: avatarUrl.trim() || null,
        }
      });

      if (error) throw error;

      // Also update profiles table if it exists
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ username: username.trim(), avatar_url: avatarUrl.trim() || null })
        .eq('id', user.id);
      
      // We don't throw if profiles update fails because the table might not have these columns or might not exist in a way we expect
      if (profileError) {
        console.warn('Profile metadata sync warning:', profileError.message);
      }

      setSuccess(true);
      await onUpdate();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md glass rounded-[32px] border border-white/10 shadow-2xl bg-[var(--bg-secondary)]/90 backdrop-blur-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tighter uppercase">Node Intelligence</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleUpdate} className="p-8 space-y-8">
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div
                  className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-blue-500/20 to-purple-600/20 border-2 border-white/10 flex items-center justify-center text-3xl font-black text-white shadow-2xl group-hover:scale-105 transition-transform overflow-hidden bg-cover bg-center"
                  style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
                >
                  {!avatarUrl && (username[0]?.toUpperCase() || '?')}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-blue-600 border-2 border-[#0a0a0a] flex items-center justify-center text-white shadow-lg cursor-pointer hover:scale-110 transition-transform">
                  <Camera className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-6">
                Identity Visualization
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">
                  {user?.email || 'No email'}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Display Name</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500/40 transition-all"
                  placeholder="Enter username"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Avatar URL</label>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500/40 transition-all"
                  placeholder="https://..."
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-400"
              >
                {error}
              </motion.div>
            )}

            <div className="pt-4 space-y-4">
              <button
                type="submit"
                disabled={loading || !username.trim()}
                className="w-full btn-primary py-4 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : success ? (
                  <>
                    <Check className="w-5 h-5 text-emerald-400" />
                    Sync Successful
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Synchronize Changes
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
              >
                <LogOut className="w-4 h-4" />
                Terminate Session
              </button>
            </div>
          </form>

          <div className="p-6 bg-black/20 border-t border-white/5 flex items-center gap-3">
            <Shield className="w-4 h-4 text-blue-500/40" />
            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">
              Encryption Protocol: TLS 1.3 · Node: {user?.id.slice(0, 8)}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
