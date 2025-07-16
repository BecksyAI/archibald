/**
 * Main layout component for Archibald's Athenaeum
 * Part of Archibald's Athenaeum - M3: Sidebar & Static Components
 */

"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { WhiskyCollection } from "./WhiskyCollection";
import { MemoryAnnexForm } from "./MemoryAnnexForm";
import { ChatInterface } from "./ChatInterface";
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
  const [activeTab, setActiveTab] = useState("chat");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isConfigured, isHydrated } = useSettings(); // Get config state here

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-switch to chat when configuration is completed
  useEffect(() => {
    if (isConfigured && activeTab !== "chat") {
      // Small delay to ensure smooth transition
      setTimeout(() => setActiveTab("chat"), 100);
    }
  }, [isConfigured, activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case "collection":
        return <WhiskyCollection className="flex-1" />;
      case "memory-annex":
        return <MemoryAnnexForm className="flex-1" />;
      case "chat":
      default:
        // Pass isConfigured down as a prop
        return children || <ChatInterface className="flex-1" isConfigured={isConfigured} />;
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
    <div className="flex h-screen w-full bg-peat-smoke text-parchment">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        onSettingsSave={onSettingsSave} // Pass down the handler
      />
      <main className="flex-1 flex flex-col overflow-hidden">{renderContent()}</main>
    </div>
  );
}
