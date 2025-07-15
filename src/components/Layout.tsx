/**
 * Main layout component for Archibald's Athenaeum
 * Part of Archibald's Athenaeum - M3: Sidebar & Static Components
 */

"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { WhiskyCollection } from "./WhiskyCollection";
import { MemoryAnnexForm } from "./MemoryAnnexForm";
import { ChatInterface } from "./ChatInterface";

interface LayoutProps {
  children?: React.ReactNode;
}

/**
 * Main layout component that manages the sidebar and content area
 * @param props - Component props
 * @returns Layout component
 */
export function Layout({ children }: LayoutProps) {
  const [activeTab, setActiveTab] = useState("chat");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "collection":
        return <WhiskyCollection className="flex-1" />;
      case "memory-annex":
        return <MemoryAnnexForm className="flex-1" />;
      case "settings":
        return (
          <div className="flex-1 p-6 lg:p-10">
            <h1 className="font-serif text-3xl font-semibold text-parchment mb-4">Settings</h1>
            <p className="text-limestone">
              Settings are managed in the sidebar. Use the System Configuration panel to adjust your preferences.
            </p>
          </div>
        );
      case "chat":
      default:
        return children || <ChatInterface className="flex-1" />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-peat-smoke text-parchment">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />
      <main className="flex-1 flex flex-col overflow-hidden">{renderContent()}</main>
    </div>
  );
}
