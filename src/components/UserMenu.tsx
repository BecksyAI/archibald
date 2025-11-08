/**
 * User menu component with logout and profile options
 */

"use client";

import React, { useState } from 'react';
import { User as UserIcon, LogOut, Settings, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export function UserMenu() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);

  if (!user) return null;

  return (
    <div className="relative flex items-center gap-2 w-full">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <UserIcon className="h-5 w-5 text-gray-700 dark:text-limestone" />
        <span className="text-sm font-medium text-gray-900 dark:text-parchment">{user.displayName}</span>
      </button>
      
      <button
        onClick={toggleTheme}
        className="ml-auto p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {theme === 'light' ? (
          <Moon className="h-4 w-4 text-gray-700 dark:text-limestone" />
        ) : (
          <Sun className="h-4 w-4 text-gray-700 dark:text-limestone" />
        )}
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-[90]"
            onClick={() => setShowMenu(false)}
          />
          <div className="fixed top-20 right-4 w-64 bg-white dark:bg-aged-oak rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[100]">
            <div className="p-4">
              <div className="px-3 py-2 text-sm text-gray-700 dark:text-limestone border-b border-gray-200 dark:border-gray-700">
                <div className="font-medium text-gray-900 dark:text-parchment">{user.displayName}</div>
                <div className="text-xs text-gray-500 dark:text-limestone/70">@{user.username}</div>
              </div>
              
              <button
                onClick={() => {
                  setShowMenu(false);
                  // TODO: Open profile settings
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-limestone hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              >
                <Settings className="h-4 w-4" />
                Profile Settings
              </button>
              
              <button
                onClick={() => {
                  logout();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

