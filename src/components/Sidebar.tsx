/**
 * Sidebar component for Archibald's Athenaeum
 * Part of Archibald's Athenaeum - M3: Sidebar & Static Components
 */

"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Library, FilePlus2, Settings, Save, X, Menu } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { LLMProvider } from "@/lib/types";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onSettingsSave: () => void; // Callback to notify parent of save
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
  onSettingsSave,
}: SidebarProps) {
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const {
    settings,
    updateSettings, // Use the bulk updater
    validateSettings,
    getMaskedApiKey,
    isConfigured,
    error,
  } = useSettings();

  const [tempSettings, setTempSettings] = useState({
    apiKey: settings.apiKey,
    llmProvider: settings.llmProvider,
    temperature: settings.temperature,
    maxTokens: settings.maxTokens,
  });

  // Update temp settings when settings change (e.g., loaded from localStorage)
  useEffect(() => {
    if (!isEditingSettings) {
      setTempSettings({
        apiKey: settings.apiKey,
        llmProvider: settings.llmProvider,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
      });
    }
  }, [settings, isEditingSettings]);

  // Auto-open settings edit mode when not configured
  useEffect(() => {
    if (!isConfigured && !isEditingSettings) {
      setIsEditingSettings(true);
    }
  }, [isConfigured, isEditingSettings]);

  const handleStartEdit = () => {
    setTempSettings({
      apiKey: settings.apiKey,
      llmProvider: settings.llmProvider,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
    });
    setIsEditingSettings(true);
  };

  const handleSaveSettings = () => {
    try {
      // FIX: Use a single, atomic update instead of multiple separate updates.
      // This prevents race conditions where updates could be overwritten.
      updateSettings(tempSettings);
      setIsEditingSettings(false);
      onSettingsSave(); // Notify parent that settings have been saved

      // Auto-switch to chat tab when settings are successfully saved
      // Use a small delay to ensure settings are fully updated
      setTimeout(() => {
        if (tempSettings.apiKey.trim()) {
          onTabChange("chat");
        }
      }, 100);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingSettings(false);
  };

  const navItems = [
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "collection", label: "Whisky Collection", icon: Library },
    { id: "memory-annex", label: "Memory Annex", icon: FilePlus2 },
  ];

  const validation = validateSettings();

  if (isCollapsed) {
    return (
      <div className="w-16 flex-shrink-0 bg-aged-oak border-r border-gray-700 flex flex-col">
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
    <aside className="w-80 flex-shrink-0 bg-aged-oak p-6 flex flex-col justify-between">
      <div>
        <header className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-semibold text-parchment">The Athenaeum</h1>
              <p className="text-limestone text-sm mt-1">A private collection of spirits & data.</p>
            </div>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-2 text-limestone hover:text-parchment transition-colors md:hidden"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
          {!isConfigured && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-400/50 rounded-lg">
              <p className="text-red-400 text-sm">Configuration required. Please set your API key in settings.</p>
            </div>
          )}
        </header>

        <nav className="flex flex-col space-y-2 mb-10">
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

        {/* Settings Panel */}
        <div className="border-t border-gray-700 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-parchment">System Configuration</h2>
            {!isEditingSettings && (
              <button
                onClick={handleStartEdit}
                className="text-limestone hover:text-amber-dram transition-colors"
                title="Edit settings"
              >
                <Settings className="h-4 w-4" />
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-400/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="api-key" className="text-sm font-medium text-limestone block mb-1">
                Access Credential (API Key)
              </label>
              {isEditingSettings ? (
                <div className="relative">
                  <input
                    id="api-key"
                    type="password"
                    value={tempSettings.apiKey}
                    onChange={(e) => setTempSettings({ ...tempSettings, apiKey: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-parchment focus:ring-2 focus:ring-amber-dram focus:border-amber-dram transition"
                  />
                  {tempSettings.apiKey && (
                    <button
                      onClick={() => setTempSettings({ ...tempSettings, apiKey: "" })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-limestone hover:text-red-400 transition-colors"
                      title="Clear API Key"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-limestone font-mono text-sm truncate">
                  {getMaskedApiKey() || "Not Set"}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="llm-provider" className="text-sm font-medium text-limestone block mb-1">
                Logic Core (LLM Provider)
              </label>
              {isEditingSettings ? (
                <select
                  id="llm-provider"
                  value={tempSettings.llmProvider}
                  onChange={(e) => setTempSettings((prev) => ({ ...prev, llmProvider: e.target.value as LLMProvider }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-parchment focus:ring-1 focus:ring-amber-dram focus:border-amber-dram transition"
                >
                  <option value="openai">OpenAI</option>
                  <option value="claude">Claude</option>
                  <option value="gemini">Gemini</option>
                </select>
              ) : (
                <div className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-parchment capitalize">
                  {settings.llmProvider}
                </div>
              )}
            </div>

            {isEditingSettings && (
              <>
                <div>
                  <label htmlFor="temperature" className="text-sm font-medium text-limestone block mb-1">
                    Temperature ({tempSettings.temperature})
                  </label>
                  <input
                    id="temperature"
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={tempSettings.temperature}
                    onChange={(e) => setTempSettings((prev) => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    className="w-full accent-amber-dram"
                  />
                </div>

                <div>
                  <label htmlFor="max-tokens" className="text-sm font-medium text-limestone block mb-1">
                    Max Tokens
                  </label>
                  <input
                    id="max-tokens"
                    type="number"
                    min="1"
                    max="4000"
                    value={tempSettings.maxTokens}
                    onChange={(e) => setTempSettings((prev) => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                    className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-parchment focus:ring-1 focus:ring-amber-dram focus:border-amber-dram transition"
                  />
                </div>
              </>
            )}

            {isEditingSettings ? (
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveSettings}
                  className="flex-1 bg-amber-dram text-parchment font-semibold py-2 rounded-lg hover:bg-amber-500 transition-colors flex items-center justify-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-700 text-parchment rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="text-xs text-limestone/70">
                <p>Status: {isConfigured ? "Configured" : "Not configured"}</p>
                {!validation.isValid && <p className="text-red-400 mt-1">{validation.errors.join(", ")}</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-limestone/50">
        <p>A.I. Sterling - Session Protocol 4.7</p>
        <p>© Current Epoch. All Rights Reserved.</p>
      </footer>
    </aside>
  );
}
