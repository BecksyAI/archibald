/**
 * User menu component with logout and profile options
 */

"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User as UserIcon, LogOut, Settings, Sun, Moon, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { SuggestionModal } from './SuggestionModal';

export function UserMenu() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!user) return null;

  const getButtonPosition = () => {
    if (!buttonRef) return { top: 20, right: 16 };
    const rect = buttonRef.getBoundingClientRect();
    const menuWidth = 256; // w-64 = 16rem = 256px
    const menuHeight = 200; // Approximate height
    const padding = 8;
    
    // Calculate position below the button
    let top = rect.bottom + padding;
    let right = window.innerWidth - rect.right;
    
    // If menu would go off bottom of screen, position above button
    if (top + menuHeight > window.innerHeight) {
      top = rect.top - menuHeight - padding;
    }
    
    // If menu would go off right of screen, align to right edge
    if (right + menuWidth > window.innerWidth) {
      right = padding;
    }
    
    // If menu would go off left of screen, align to left edge
    if (right < 0) {
      right = padding;
    }
    
    return { top, right };
  };

  const position = showMenu && buttonRef ? getButtonPosition() : { top: 20, right: 16 };

  const menuContent = showMenu && mounted ? (
    <>
      <div
        className="fixed inset-0 z-[90]"
        onClick={() => setShowMenu(false)}
      />
      <div
        className="fixed w-64 bg-white dark:bg-aged-oak rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[100]"
        style={{ top: `${position.top}px`, right: `${position.right}px` }}
        onClick={(e) => e.stopPropagation()}
      >
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
  ) : null;

  return (
    <div className="relative flex items-center justify-between gap-2 w-full">
      <button
        ref={setButtonRef}
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <UserIcon className="h-5 w-5 text-gray-700 dark:text-limestone" />
        <span className="text-sm font-medium text-gray-900 dark:text-parchment">{user.displayName}</span>
      </button>
      
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
      </div>

      {mounted && typeof document !== 'undefined' ? createPortal(menuContent, document.body) : null}

      <SuggestionModal
        isOpen={showSuggestionModal}
        onClose={() => setShowSuggestionModal(false)}
      />
    </div>
  );
}

