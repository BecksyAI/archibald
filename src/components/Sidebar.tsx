/**
 * Sidebar component for Archibald's Athenaeum
 * Part of Archibald's Athenaeum - M3: Sidebar & Static Components
 */

"use client";

import React from "react";
import { MessageSquare, Library, FilePlus2, X, Menu, Calendar, Sun, Moon, Shield, Settings, MessageCircle } from "lucide-react";
import { AuthButton } from "./AuthButton";
import { MigrationButton } from "./MigrationButton";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onSettingsSave: () => void; // Callback to notify parent of save
  mobileMenuOpen?: boolean;
}

/**
 * Main sidebar component with navigation and settings
 * @param props - Component props
 * @returns Sidebar component
 */
export function Sidebar({
  activeTab,
  onTabChange,
  isCollapsed = false,
  onToggleCollapse,
  mobileMenuOpen = false,
}: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const navItems = [
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "collection", label: "Collection", icon: Library },
    { id: "events", label: "Events", icon: Calendar },
    { id: "memory-annex", label: "Memory Annex", icon: FilePlus2 },
    ...(user && (user.role === 'admin' || user.role === 'superadmin') ? [
      { id: "admin", label: "Admin", icon: Settings },
      { id: "suggestions", label: "Suggestions", icon: MessageCircle },
    ] : []),
    ...(user && user.role === 'superadmin' ? [
      { id: "superadmin", label: "Super Admin", icon: Shield },
    ] : []),
  ];

  if (isCollapsed) {
    // On mobile, don't show collapsed sidebar - use floating button instead
    return (
      <div className="hidden md:flex w-16 flex-shrink-0 bg-aged-oak dark:bg-aged-oak bg-light-surface border-r border-gray-700 dark:border-gray-700 border-light-border flex flex-col">
        <button onClick={onToggleCollapse} className="p-4 text-limestone hover:text-parchment transition-colors">
          <Menu className="h-6 w-6" />
        </button>
        <nav className="flex flex-col space-y-2 p-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                p-3 rounded-lg transition-colors flex items-center justify-center
                ${
                  activeTab === item.id
                    ? "bg-amber-dram/10 border border-amber-dram/50 text-amber-dram"
                    : "text-limestone hover:bg-gray-700/50 hover:text-parchment"
                }
              `}
              title={item.label}
            >
              <item.icon className="h-5 w-5" />
            </button>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <>
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggleCollapse}
          aria-hidden="true"
        />
      )}
      <aside className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-80 flex-shrink-0 bg-aged-oak dark:bg-aged-oak bg-light-surface border-r border-gray-700 dark:border-gray-700 border-light-border p-4 md:p-6 flex flex-col transition-transform duration-300 overflow-y-auto`}>
        <div className="flex-1 flex flex-col min-h-0">
          <header className="mb-6 md:mb-10 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-serif text-2xl md:text-3xl font-semibold text-parchment dark:text-parchment text-light-text">The Athenaeum</h1>
                <p className="text-limestone text-sm mt-1">A private collection of spirits & data.</p>
              </div>
              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  className="p-2 text-limestone hover:text-parchment transition-colors md:hidden"
                  aria-label="Close sidebar"
                >
                  <X className="h-6 w-6" />
                </button>
              )}
            </div>
          </header>

          <nav className="flex flex-col space-y-2 mb-6 md:mb-10 flex-1 min-h-0 overflow-y-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`
                  flex items-center p-3 rounded-lg transition-colors
                  ${
                    activeTab === item.id
                      ? "text-parchment bg-amber-dram/10 border border-amber-dram/50"
                      : "text-limestone hover:bg-gray-700/50 hover:text-parchment"
                  }
                `}
              >
                <item.icon className={`h-5 w-5 mr-3 ${activeTab === item.id ? "text-amber-dram" : ""}`} />
                <span className="font-semibold">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <footer className="border-t border-gray-700 dark:border-gray-700 border-light-border pt-4 md:pt-6 flex-shrink-0">
          <div className="mb-4">
            <MigrationButton />
            <AuthButton />
          </div>
          {!user && (
            <div className="mb-4">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 dark:bg-gray-700 bg-gray-200 text-gray-700 dark:text-limestone text-light-text font-semibold rounded-lg hover:bg-gray-600 dark:hover:bg-gray-600 transition-colors"
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </button>
            </div>
          )}
          <div className="text-center text-xs text-limestone/50 dark:text-limestone/50 text-light-text-secondary/50">
            <p>Made with ❤️ by PureFunction AI</p>
          </div>
        </footer>
      </aside>
    </>
  );
}
