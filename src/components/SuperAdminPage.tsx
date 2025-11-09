/**
 * Super Admin Page
 * Allows super admin to manage users and their roles
 */

"use client";

import React, { useState, useEffect } from 'react';
import { Users, Shield, UserCheck, UserX, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/lib/types';

export function SuperAdminPage({ className }: { className?: string }) {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'superadmin') {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('archibald_token');
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(data.users || []);
      } else {
        setError(data.error || 'Failed to load users');
      }
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'user' | 'admin' | 'superadmin') => {
    try {
      setUpdating(userId);
      const token = localStorage.getItem('archibald_token');
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      } else {
        alert(data.error || 'Failed to update user role');
      }
    } catch {
      alert('Failed to update user role');
    } finally {
      setUpdating(null);
    }
  };

  if (user?.role !== 'superadmin') {
    return (
      <div className={`flex flex-col h-full items-center justify-center p-6 ${className}`}>
        <div className="text-center">
          <Shield className="h-12 w-12 text-limestone mx-auto mb-4" />
          <h2 className="font-serif text-xl font-semibold text-parchment mb-2">Super Admin Access Required</h2>
          <p className="text-limestone">You must be a super admin to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-aged-oak dark:bg-aged-oak bg-light-surface border-b border-gray-700 dark:border-gray-700 border-light-border md:pl-6 pl-20">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-amber-dram" />
          <div>
            <h1 className="font-serif text-2xl font-semibold text-parchment dark:text-parchment text-light-text">Super Admin</h1>
            <p className="text-limestone dark:text-limestone text-light-text-secondary text-sm mt-1">
              Manage users and their roles
            </p>
          </div>
        </div>
      </div>

      {/* Users List */}
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
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-limestone/50 mx-auto mb-4" />
            <h2 className="font-serif text-xl font-semibold text-parchment mb-2">No Users Found</h2>
            <p className="text-limestone">No users in the system yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((u) => (
              <div
                key={u.id}
                className="bg-aged-oak dark:bg-aged-oak bg-light-surface border border-gray-700 dark:border-gray-700 border-light-border rounded-lg p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-serif text-lg font-semibold text-parchment dark:text-parchment text-light-text">
                        {u.displayName}
                      </h3>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        u.role === 'superadmin' ? 'bg-purple-900/50 text-purple-300' :
                        u.role === 'admin' ? 'bg-blue-900/50 text-blue-300' :
                        'bg-gray-700 text-limestone'
                      }`}>
                        {u.role}
                      </span>
                      {u.claimed && (
                        <span className="text-xs text-green-400">(Claimed)</span>
                      )}
                    </div>
                    <p className="text-sm text-limestone dark:text-limestone text-light-text-secondary mb-1">
                      @{u.username}
                    </p>
                    {u.claimedAt && (
                      <p className="text-xs text-limestone/70 dark:text-limestone/70 text-light-text-secondary/70">
                        Claimed: {new Date(u.claimedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {u.id !== user.id && (
                      <>
                        {u.role !== 'user' && (
                          <button
                            onClick={() => updateUserRole(u.id, 'user')}
                            disabled={updating === u.id}
                            className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-700 text-limestone rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
                            title="Remove admin/superadmin role"
                          >
                            {updating === u.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <UserX className="h-3 w-3" />
                            )}
                            Make User
                          </button>
                        )}
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => updateUserRole(u.id, 'admin')}
                            disabled={updating === u.id}
                            className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                            title="Make admin"
                          >
                            {updating === u.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <UserCheck className="h-3 w-3" />
                            )}
                            Make Admin
                          </button>
                        )}
                        {u.role !== 'superadmin' && (
                          <button
                            onClick={() => updateUserRole(u.id, 'superadmin')}
                            disabled={updating === u.id}
                            className="flex items-center gap-1 px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50"
                            title="Make super admin"
                          >
                            {updating === u.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Shield className="h-3 w-3" />
                            )}
                            Make Super Admin
                          </button>
                        )}
                      </>
                    )}
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

