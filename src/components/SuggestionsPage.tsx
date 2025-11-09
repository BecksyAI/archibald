/**
 * Suggestions Page component
 * Admin page to view all suggestions
 */

"use client";

import React, { useState, useEffect } from 'react';
import { MessageSquare, User, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Suggestion {
  id: string;
  text: string;
  createdBy: {
    username: string;
    displayName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function SuggestionsPage({ className }: { className?: string }) {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
      fetchSuggestions();
    }
  }, [user]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('archibald_token');
      const response = await fetch('/api/suggestions', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();

      if (response.ok) {
        setSuggestions(data.suggestions || []);
      } else {
        setError(data.error || 'Failed to load suggestions');
      }
    } catch {
      setError('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <p className="text-red-400">You must be an admin to view suggestions.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-dram mx-auto mb-4"></div>
          <p className="text-limestone">Loading suggestions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-aged-oak border-b border-gray-700 md:pl-6 pl-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-parchment">Suggestions</h1>
            <p className="text-limestone text-sm mt-1">
              {suggestions.length} {suggestions.length === 1 ? 'suggestion' : 'suggestions'} received
            </p>
          </div>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-400/50 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {suggestions.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 text-limestone/50 mx-auto mb-4" />
            <h2 className="font-serif text-xl font-semibold text-parchment mb-2">No Suggestions Yet</h2>
            <p className="text-limestone">No suggestions have been submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="bg-aged-oak border border-gray-700 rounded-lg p-6 hover:border-amber-dram/50 transition-colors"
              >
                <div className="mb-4">
                  <p className="text-parchment text-base leading-relaxed">{suggestion.text}</p>
                </div>

                <div className="flex items-center gap-4 text-sm text-limestone border-t border-gray-700 pt-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{suggestion.createdBy.displayName} (@{suggestion.createdBy.username})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(suggestion.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

