/**
 * Main layout component for Archibald's Athenaeum
 * Part of Archibald's Athenaeum - M3: Sidebar & Static Components
 */

"use client";

import React, { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { WhiskyCollection } from "./WhiskyCollection";
import { MemoryAnnexForm } from "./MemoryAnnexForm";
import { ChatInterface } from "./ChatInterface";
import { EventsPage } from "./EventsPage";
import { AdminPage } from "./AdminPage";
import { SuperAdminPage } from "./SuperAdminPage";
import { SuggestionsPage } from "./SuggestionsPage";
import { useSettings } from "@/hooks/useSettings";

interface LayoutProps {
  children?: React.ReactNode;
  settingsVersion: number; // Add a version prop to force re-render
  onSettingsSave: () => void; // Add callback for when settings are saved
}

/**
 * Main layout component that manages the sidebar and content area
 * @param props - Component props
 * @returns Layout component
 */
export function Layout({ children, settingsVersion, onSettingsSave }: LayoutProps) {
  const { isConfigured, isHydrated } = useSettings();
  const [activeTab, setActiveTab] = useState("chat");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Additional effect to ensure we get the latest state when it changes
  useEffect(() => {
    // This effect should run whenever the settings are updated
    // Force a re-render to ensure we're using the latest state
    // The effect itself will trigger a re-render when dependencies change
  }, [settingsVersion, isConfigured]);

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      // On mobile, toggle the mobile menu
      setMobileMenuOpen((prev) => {
        const newValue = !prev;
        setSidebarCollapsed(!newValue); // When menu is open, sidebar is not collapsed
        return newValue;
      });
    } else {
      // On desktop, toggle collapse
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
        // Don't auto-close mobile menu on resize, let user control it
      } else {
        setSidebarCollapsed(false);
        setMobileMenuOpen(false);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Force re-render when settingsVersion changes (settings are saved)
  useEffect(() => {
    // This effect runs when settings are saved, forcing a re-render
    // of the entire layout with updated isConfigured state
    // The effect itself will trigger a re-render when dependencies change
  }, [settingsVersion]);

  const renderContent = () => {
    switch (activeTab) {
      case "collection":
        return <WhiskyCollection className="flex-1" />;
      case "events":
        return <EventsPage className="flex-1" />;
      case "memory-annex":
        return <MemoryAnnexForm className="flex-1" />;
      case "admin":
        return <AdminPage className="flex-1" />;
      case "suggestions":
        return <SuggestionsPage className="flex-1" />;
      case "superadmin":
        return <SuperAdminPage className="flex-1" />;
      case "chat":
      default:
        // Always pass the current isConfigured state and settingsVersion to force re-renders
        return (
          children || (
            <ChatInterface className="flex-1" />
          )
        );
    }
  };

  // Show loading state during hydration to prevent mismatch
  if (!isHydrated) {
    return (
      <div className="flex h-screen w-full bg-peat-smoke text-parchment items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-dram mx-auto mb-4"></div>
          <p className="text-limestone">Loading Archibald&apos;s Athenaeum...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-peat-smoke dark:bg-peat-smoke bg-light-bg text-parchment dark:text-parchment text-light-text">
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          // Only close mobile menu on mobile, not on desktop
          if (window.innerWidth < 768) {
            setMobileMenuOpen(false);
            setSidebarCollapsed(true);
          }
        }}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        onSettingsSave={onSettingsSave} // Pass down the handler
        mobileMenuOpen={mobileMenuOpen}
      />
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 w-full md:w-auto">
        {/* Hamburger menu - always show on mobile when sidebar is closed */}
        {!mobileMenuOpen && (
          <button
            onClick={toggleSidebar}
            className="md:hidden fixed top-4 left-4 z-50 p-2 bg-aged-oak dark:bg-aged-oak bg-light-surface border border-gray-700 dark:border-gray-700 border-light-border rounded-lg text-limestone hover:text-parchment transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        )}
        {renderContent()}
      </main>
    </div>
  );
}
