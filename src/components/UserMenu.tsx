/**
 * User menu component with logout button
 */

"use client";

import React, { useState } from 'react';
import { LogOut, Sun, Moon, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { SuggestionModal } from './SuggestionModal';

export function UserMenu() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);

  if (!user) return null;

  return (
    <div className="relative flex items-center justify-between gap-2 w-full">
      {/* Name display - not clickable */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900 dark:text-parchment">{user.displayName}</span>
      </div>
      
      {/* Right-aligned icon buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowSuggestionModal(true)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Add Suggestion"
        >
          <MessageSquare className="h-4 w-4 text-gray-700 dark:text-limestone" />
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? (
            <Moon className="h-4 w-4 text-gray-700 dark:text-limestone" />
          ) : (
            <Sun className="h-4 w-4 text-gray-700 dark:text-limestone" />
          )}
        </button>

        <button
          onClick={logout}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Logout"
        >
          <LogOut className="h-4 w-4 text-gray-700 dark:text-limestone" />
        </button>
      </div>

      <SuggestionModal
        isOpen={showSuggestionModal}
        onClose={() => setShowSuggestionModal(false)}
      />
    </div>
  );
}

