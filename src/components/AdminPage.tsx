/**
 * Admin Page
 * Allows admins to manage content and view system stats
 */

"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Users, Calendar, Wine, MessageSquare, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Stats {
  events: number;
  whiskies: number;
  reviews: number;
  users: number;
}

export function AdminPage({ className }: { className?: string }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch all stats
      const [eventsRes, whiskiesRes, reviewsRes, usersRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/whisky'),
        fetch('/api/reviews'),
        user?.role === 'superadmin' ? fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('archibald_token')}`,
          },
        }) : Promise.resolve({ ok: false, json: () => Promise.resolve({ users: [] }) }),
      ]);

      const [eventsData, whiskiesData, reviewsData, usersData] = await Promise.all([
        eventsRes.json(),
        whiskiesRes.json(),
        reviewsRes.json(),
        usersRes.json(),
      ]);

      setStats({
        events: eventsData.events?.length || 0,
        whiskies: whiskiesData.whiskies?.length || 0,
        reviews: reviewsData.reviews?.length || 0,
        users: usersData.users?.length || 0,
      });
    } catch {
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return (
      <div className={`flex flex-col h-full items-center justify-center p-6 ${className}`}>
        <div className="text-center">
          <Settings className="h-12 w-12 text-limestone mx-auto mb-4" />
          <h2 className="font-serif text-xl font-semibold text-parchment mb-2">Admin Access Required</h2>
          <p className="text-limestone">You must be an admin to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-aged-oak dark:bg-aged-oak bg-light-surface border-b border-gray-700 dark:border-gray-700 border-light-border">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-amber-dram" />
          <div>
            <h1 className="font-serif text-2xl font-semibold text-parchment dark:text-parchment text-light-text">Admin Dashboard</h1>
            <p className="text-limestone dark:text-limestone text-light-text-secondary text-sm mt-1">
              System statistics and management
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-400/50 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-amber-dram animate-spin" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-aged-oak dark:bg-aged-oak bg-light-surface border border-gray-700 dark:border-gray-700 border-light-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="h-8 w-8 text-amber-dram" />
                <div>
                  <h3 className="font-serif text-lg font-semibold text-parchment dark:text-parchment text-light-text">Events</h3>
                  <p className="text-3xl font-bold text-amber-dram mt-1">{stats.events}</p>
                </div>
              </div>
            </div>

            <div className="bg-aged-oak dark:bg-aged-oak bg-light-surface border border-gray-700 dark:border-gray-700 border-light-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Wine className="h-8 w-8 text-amber-dram" />
                <div>
                  <h3 className="font-serif text-lg font-semibold text-parchment dark:text-parchment text-light-text">Whiskies</h3>
                  <p className="text-3xl font-bold text-amber-dram mt-1">{stats.whiskies}</p>
                </div>
              </div>
            </div>

            <div className="bg-aged-oak dark:bg-aged-oak bg-light-surface border border-gray-700 dark:border-gray-700 border-light-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="h-8 w-8 text-amber-dram" />
                <div>
                  <h3 className="font-serif text-lg font-semibold text-parchment dark:text-parchment text-light-text">Reviews</h3>
                  <p className="text-3xl font-bold text-amber-dram mt-1">{stats.reviews}</p>
                </div>
              </div>
            </div>

            <div className="bg-aged-oak dark:bg-aged-oak bg-light-surface border border-gray-700 dark:border-gray-700 border-light-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-8 w-8 text-amber-dram" />
                <div>
                  <h3 className="font-serif text-lg font-semibold text-parchment dark:text-parchment text-light-text">Users</h3>
                  <p className="text-3xl font-bold text-amber-dram mt-1">{stats.users}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

