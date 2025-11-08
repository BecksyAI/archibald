/**
 * Migration button component for admins
 * Allows running the migration script to populate the database
 */

"use client";

import React, { useState } from 'react';
import { Database, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function MigrationButton() {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!user || user.role !== 'admin') {
    return null;
  }

  const handleMigration = async () => {
    if (!confirm('This will import all whisky and event data from WhiskyEventSheet.txt. Continue?')) {
      return;
    }

    setIsRunning(true);
    setResult(null);

    try {
      const token = localStorage.getItem('archibald_token');
      const response = await fetch('/api/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: `Migration successful! Created ${data.results.events} events, ${data.results.whiskies} whiskies, ${data.results.reviews} reviews, and ${data.results.users} users.`,
        });
        // Refresh the page after 2 seconds to show new data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setResult({
          success: false,
          message: data.error || 'Migration failed',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Migration failed',
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="mb-4">
      <button
        onClick={handleMigration}
        disabled={isRunning}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRunning ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Running Migration...
          </>
        ) : (
          <>
            <Database className="h-4 w-4" />
            Run Data Migration
          </>
        )}
      </button>
      {result && (
        <div className={`mt-2 p-3 rounded-lg text-sm ${
          result.success
            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-400'
            : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-400'
        }`}>
          {result.message}
        </div>
      )}
    </div>
  );
}

