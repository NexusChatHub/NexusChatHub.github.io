'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Hash, Info, Plus, LoaderCircle } from 'lucide-react';

type CreateChannelModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => Promise<void>;
};

export function CreateChannelModal({ isOpen, onClose, onCreate }: CreateChannelModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Normalize channel name: lowercase, replace spaces with dashes, strip special chars
  const normalizeName = (raw: string) =>
    raw.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = normalizeName(name);
    if (!finalName || loading) return;
    setLoading(true);
    setError(null);
    try {
      await onCreate(finalName, description.trim());
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the channel.');
    } finally {
      setLoading(false);
    }
  };

  const preview = normalizeName(name);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg glass p-8 rounded-[32px] border-[var(--border-color)] shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Create Room</h2>
                <p className="text-sm text-[var(--text-muted)] font-medium mt-1">Start a new conversation thread</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="eyebrow ml-1">Room Name</label>
                <div className="relative group">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={handleNameChange}
                    placeholder="e.g. general-sync"
                    className="input-modern pl-12"
                    autoFocus
                  />
                </div>
                {name && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest ml-1"
                  >
                    Will be created as:{' '}
                    <span className="text-blue-500">#{preview || '...'}</span>
                  </motion.p>
                )}
              </div>

              <div className="space-y-2">
                <label className="eyebrow ml-1">Description <span className="normal-case font-medium">(optional)</span></label>
                <div className="relative group">
                  <Info className="absolute left-4 top-4 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-blue-500 transition-colors" />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What's this room for?"
                    className="input-modern pl-12 min-h-[100px] resize-none py-4"
                    maxLength={200}
                  />
                  <span className="absolute bottom-3 right-4 text-[9px] text-[var(--text-muted)] font-black">
                    {description.length}/200
                  </span>
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-400"
                >
                  {error}
                </motion.p>
              )}

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={onClose} className="btn-secondary flex-1 py-4">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !preview}
                  className="btn-primary flex-1 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <LoaderCircle className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <span>Create Room</span>
                      <Plus className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
