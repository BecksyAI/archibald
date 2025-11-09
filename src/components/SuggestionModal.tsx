/**
 * Suggestion Modal component
 * Simple modal for submitting suggestions
 */

"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SuggestionModal({ isOpen, onClose }: SuggestionModalProps) {
  const { user } = useAuth();
  const [suggestion, setSuggestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSuggestion('');
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to submit a suggestion');
      return;
    }

    if (!suggestion.trim()) {
      setError('Please enter a suggestion');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('archibald_token');
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: suggestion }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setSuggestion('');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(data.error || 'Failed to submit suggestion');
      }
    } catch {
      setError('Failed to submit suggestion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-aged-oak rounded-lg shadow-xl max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-semibold text-parchment">Add Suggestion</h2>
          <button
            onClick={onClose}
            className="p-2 text-limestone hover:text-parchment transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="text-green-600 dark:text-green-400 mb-2">✓ Suggestion submitted!</div>
            <p className="text-limestone text-sm">Thank you for your feedback.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-limestone mb-2">
                Your Suggestion
              </label>
              <textarea
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your suggestion here..."
                className="w-full px-4 py-3 bg-gray-900 dark:bg-gray-900 border border-gray-700 dark:border-gray-700 rounded-lg text-parchment dark:text-parchment focus:ring-2 focus:ring-amber-dram focus:border-amber-dram resize-none"
                rows={4}
                disabled={isSubmitting}
                autoFocus
              />
              <p className="text-xs text-limestone mt-1">
                Press Ctrl+Enter (or Cmd+Enter on Mac) to submit
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-400/50 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting || !suggestion.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-dram text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-700 dark:border-gray-700 text-parchment dark:text-parchment rounded-lg hover:bg-gray-700/50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}

