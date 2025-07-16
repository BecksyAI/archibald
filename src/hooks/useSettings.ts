/**
 * Settings management hook for API keys and LLM configuration
 * Part of Archibald's Athenaeum - M2: Core Logic & Hooks
 */

import { useCallback, useMemo } from "react";
import {
  useLocalStorage,
  deleteStorageKey,
  clearAllArchibaldData,
  hasStorageKey,
  getArchibaldKeys,
} from "./useLocalStorage";
import { AppSettings, LLMProvider } from "@/lib/types";
import { validateAppSettings } from "@/lib/validation";

const DEFAULT_SETTINGS: AppSettings = {
  apiKey: "",
  llmProvider: "openai",
  temperature: 0.7,
  maxTokens: 1000,
};

/**
 * Hook for managing application settings with validation and secure storage
 * @returns Settings object with getters, setters, and validation status
 */
export function useSettings() {
  const [settings, setSettings, storageError, clearSettings, isHydrated] = useLocalStorage<AppSettings>(
    "archibald-settings",
    DEFAULT_SETTINGS,
    true // Encrypt settings since they contain API keys
  );

  /**
   * Update API key with validation
   * @param apiKey - The new API key
   */
  const updateApiKey = useCallback(
    (apiKey: string) => {
      setSettings((prev) => ({ ...prev, apiKey: apiKey.trim() }));
    },
    [setSettings]
  );

  /**
   * Update LLM provider with validation
   * @param provider - The new LLM provider
   */
  const updateLLMProvider = useCallback(
    (provider: LLMProvider) => {
      setSettings((prev) => ({ ...prev, llmProvider: provider }));
    },
    [setSettings]
  );

  /**
   * Update temperature setting with validation
   * @param temperature - The new temperature value (0-2)
   */
  const updateTemperature = useCallback(
    (temperature: number) => {
      const clampedTemp = Math.max(0, Math.min(2, temperature));
      setSettings((prev) => ({ ...prev, temperature: clampedTemp }));
    },
    [setSettings]
  );

  /**
   * Update max tokens setting with validation
   * @param maxTokens - The new max tokens value (1-4000)
   */
  const updateMaxTokens = useCallback(
    (maxTokens: number) => {
      const clampedTokens = Math.max(1, Math.min(4000, maxTokens));
      setSettings((prev) => ({ ...prev, maxTokens: clampedTokens }));
    },
    [setSettings]
  );

  /**
   * Update multiple settings at once
   * @param updates - Partial settings object with updates
   */
  const updateSettings = useCallback(
    (updates: Partial<AppSettings>) => {
      setSettings((prev) => ({ ...prev, ...updates }));
    },
    [setSettings]
  );

  /**
   * Reset settings to defaults
   */
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, [setSettings]);

  /**
   * Validate current settings
   * @returns Validation result with errors if any
   */
  const validateSettings = useCallback(() => {
    try {
      // Create a copy of settings to avoid validation issues with empty API key
      const settingsToValidate = { ...settings };

      // If API key is empty, use a dummy key for validation structure check
      if (!settingsToValidate.apiKey || settingsToValidate.apiKey.trim() === "") {
        settingsToValidate.apiKey = "dummy-key-for-validation";
      }

      validateAppSettings(settingsToValidate);
      return { isValid: true, errors: [] };
    } catch (error) {
      return {
        isValid: false,
        errors: error instanceof Error ? [error.message] : ["Unknown validation error"],
      };
    }
  }, [settings]);

  /**
   * Check if API key is configured
   */
  const isApiKeyConfigured = useMemo(() => {
    return settings.apiKey.trim().length > 0;
  }, [settings.apiKey]);

  /**
   * Check if settings are complete for making API calls
   */
  const isConfigured = useMemo(() => {
    const validation = validateSettings();
    return validation.isValid && isApiKeyConfigured;
  }, [validateSettings, isApiKeyConfigured]);

  /**
   * Get provider-specific configuration
   */
  const getProviderConfig = useCallback(() => {
    switch (settings.llmProvider) {
      case "openai":
        return {
          apiUrl: "https://api.openai.com/v1/chat/completions",
          model: "gpt-4o-mini",
          headers: {
            Authorization: `Bearer ${settings.apiKey}`,
            "Content-Type": "application/json",
          } as Record<string, string>,
        };
      case "claude":
        return {
          apiUrl: "https://api.anthropic.com/v1/messages",
          model: "claude-3-sonnet-20240229",
          headers: {
            "x-api-key": settings.apiKey,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
          } as Record<string, string>,
        };
      case "gemini":
        return {
          apiUrl: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${settings.apiKey}`,
          model: "gemini-1.5-flash",
          headers: {
            "Content-Type": "application/json",
          } as Record<string, string>,
        };
      default:
        throw new Error(`Unsupported provider: ${settings.llmProvider}`);
    }
  }, [settings]);

  /**
   * Get masked API key for display purposes
   */
  const getMaskedApiKey = useCallback(() => {
    if (!settings.apiKey) return "";

    const key = settings.apiKey.trim();
    if (key.length <= 8) return "••••••••";

    return key.substring(0, 4) + "••••••••••••••••••••" + key.substring(key.length - 4);
  }, [settings.apiKey]);

  /**
   * Clear all Archibald data from localStorage
   */
  const clearAllData = useCallback(() => {
    const result = clearAllArchibaldData();
    if (result.success) {
      // Reset current settings to defaults
      setSettings(DEFAULT_SETTINGS);
    }
    return result;
  }, [setSettings]);

  /**
   * Delete a specific localStorage key
   */
  const deleteKey = useCallback((key: string) => {
    return deleteStorageKey(key);
  }, []);

  /**
   * Check if a specific key exists in localStorage
   */
  const hasKey = useCallback((key: string) => {
    return hasStorageKey(key);
  }, []);

  /**
   * Get all Archibald-related keys from localStorage
   */
  const getAllKeys = useCallback(() => {
    return getArchibaldKeys();
  }, []);

  /**
   * Get storage info about the current settings
   */
  const getStorageInfo = useCallback(() => {
    return {
      hasSettingsKey: hasStorageKey("archibald-settings"),
      hasChatHistory: hasStorageKey("archibald-chat-history"),
      hasMemoryAnnex: hasStorageKey("archibald-memory-annex"),
      allKeys: getArchibaldKeys(),
    };
  }, []);

  return {
    // Current settings
    settings,

    // Individual setters
    updateApiKey,
    updateLLMProvider,
    updateTemperature,
    updateMaxTokens,

    // Bulk operations
    updateSettings,
    resetSettings,
    clearSettings,

    // Advanced localStorage management
    clearAllData,
    deleteKey,
    hasKey,
    getAllKeys,
    getStorageInfo,

    // Validation
    validateSettings,
    isApiKeyConfigured,
    isConfigured, // Always return current state for immediate updates

    // Provider utilities
    getProviderConfig,
    getMaskedApiKey,

    // Error handling
    error: storageError,

    // Hydration state
    isHydrated,
  };
}

/**
 * Hook for checking if settings are properly configured
 * @returns Boolean indicating if the app is ready to make API calls
 */
export function useSettingsStatus() {
  const { isConfigured, validateSettings, error } = useSettings();

  return {
    isReady: isConfigured && !error,
    isConfigured,
    hasError: !!error,
    error,
    validation: validateSettings(),
  };
}
