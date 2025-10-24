'use client';

import { useState } from 'react';

interface RestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: () => Promise<void>;
  title: string;
  name: string;
  type: 'cold' | 'completed';
}

export default function RestoreModal({ isOpen, onClose, onRestore, title, name, type }: RestoreModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleRestore = async () => {
    setIsSubmitting(true);
    try {
      await onRestore();
      onClose();
    } catch (error) {
      console.error('Restore error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 py-6">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-xl border border-[#373e47] bg-[#1e2227] shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-[#373e47] px-6 py-4 bg-[#2d333b]">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="mb-6">
            <p className="text-lg font-semibold text-white mb-2">{name}</p>
            <p className="text-sm text-gray-400">
              {type === 'cold'
                ? 'This lead is marked as cold. Restore it to move it back to your active leads.'
                : 'This job is marked as completed. Restore it to move it back to scheduled jobs.'}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-lg border border-gray-500 bg-transparent px-4 py-2.5 text-sm font-semibold text-gray-300 transition-colors hover:bg-gray-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={handleRestore}
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
            >
              {isSubmitting ? 'Restoring...' : 'Restore'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
