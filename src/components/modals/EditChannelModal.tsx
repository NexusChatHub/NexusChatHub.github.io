'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Hash, Info, Save, LoaderCircle, Trash2 } from 'lucide-react';
import type { Channel, EntityId } from '../chat/types';

type EditChannelModalProps = {
  isOpen: boolean;
  channel: Channel | null;
  onClose: () => void;
  onUpdate: (id: EntityId, name: string, description: string) => Promise<void>;
  onDelete: (id: EntityId) => Promise<void>;
};

export function EditChannelModal({ isOpen, channel, onClose, onUpdate, onDelete }: EditChannelModalProps) {
  const [name, setName] = useState(channel?.name || '');
  const [description, setDescription] = useState(channel?.description || '');
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Sync with channel when it changes
  const channelId = channel?.id;
  if (channel && (name !== channel.name || description !== (channel.description ?? '')) && !loading) {
    // Only reset if modal is freshly opened (no user edits yet assumed on first render)
    // Controlled via the key prop on the modal in the parent
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channel || !name.trim() || loading) return;
    setLoading(true);
    await onUpdate(channel.id, name.trim(), description.trim());
    setLoading(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!channel || loading) return;
    setLoading(true);
    await onDelete(channel.id);
    setLoading(false);
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
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            key={String(channelId)}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg glass p-8 rounded-[32px] border-[var(--border-color)] shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Edit Room</h2>
                <p className="text-sm text-[var(--text-muted)] font-medium mt-1">Update #{channel?.name}</p>
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
                    onChange={(e) => setName(e.target.value)}
                    placeholder="room-name"
                    className="input-modern pl-12"
                    autoFocus
                  />
                </div>
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

              <div className="flex gap-4 pt-2">
                <button type="button" onClick={onClose} className="btn-secondary flex-1 py-4">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="btn-primary flex-1 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <LoaderCircle className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <span>Save Changes</span>
                      <Save className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Danger Zone */}
            <div className="mt-8 pt-8 border-t border-red-500/20">
              <p className="eyebrow text-red-500 mb-4">Danger Zone</p>
              <AnimatePresence mode="wait">
                {!deleteConfirm ? (
                  <motion.button
                    key="delete-btn"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setDeleteConfirm(true)}
                    className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Room
                  </motion.button>
                ) : (
                  <motion.div
                    key="delete-confirm"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <p className="text-[10px] text-red-500 font-black uppercase tracking-widest text-center">
                      This will permanently delete #{channel?.name} and all its messages.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setDeleteConfirm(false)}
                        className="flex-1 py-3 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] text-xs font-black uppercase tracking-widest hover:bg-[var(--bg-tertiary)] transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => void handleDelete()}
                        disabled={loading}
                        className="flex-1 py-3 rounded-xl bg-red-500 text-white text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50"
                      >
                        {loading ? <LoaderCircle className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Delete'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
