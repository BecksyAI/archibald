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
  const { isConfigured, isHydrated } = useSettings();
  const [activeTab, setActiveTab] = useState("chat");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [forceRender, setForceRender] = useState(0);

  // Debug logging for isConfigured changes
  useEffect(() => {
    console.log("[Layout] isConfigured changed:", isConfigured);
  }, [isConfigured]);

  // Debug logging for settingsVersion changes
  useEffect(() => {
    console.log("[Layout] settingsVersion changed:", settingsVersion);
  }, [settingsVersion]);

  // Additional effect to ensure we get the latest state when it changes
  useEffect(() => {
    // This effect should run whenever the settings are updated
    // Force a re-render to ensure we're using the latest state
    if (settingsVersion > 0) {
      console.log("[Layout] Settings version updated, forcing re-render");
      setForceRender((prev) => prev + 1);
    }
  }, [settingsVersion, isConfigured]);

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

  // Force re-render when settingsVersion changes (settings are saved)
  useEffect(() => {
    // This effect runs when settings are saved, forcing a re-render
    // of the entire layout with updated isConfigured state
    console.log("[Layout] Forcing re-render due to settings save");

    // Force a re-render to ensure we get the latest state
    setForceRender((prev) => prev + 1);

    // Also force a re-render after a small delay to ensure state propagation
    const timeoutId = setTimeout(() => {
      setForceRender((prev) => prev + 1);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [settingsVersion]);

  const renderContent = () => {
    console.log(
      "[Layout] Rendering content for activeTab:",
      activeTab,
      "isConfigured:",
      isConfigured,
      "forceRender:",
      forceRender
    );
    switch (activeTab) {
      case "collection":
        return <WhiskyCollection className="flex-1" />;
      case "memory-annex":
        return <MemoryAnnexForm className="flex-1" />;
      case "chat":
      default:
        // Always pass the current isConfigured state and settingsVersion to force re-renders
        return (
          children || (
            <ChatInterface
              className="flex-1"
              isConfigured={isConfigured}
              settingsVersion={settingsVersion}
              key={`chat-${settingsVersion}-${forceRender}`} // Force ChatInterface to re-mount when state changes
            />
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

  console.log("[Layout] Rendering Layout with isConfigured:", isConfigured);

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
