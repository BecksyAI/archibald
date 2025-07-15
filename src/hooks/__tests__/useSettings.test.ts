/**
 * Unit tests for useSettings hook
 */

import { renderHook, act } from "@testing-library/react";
import { useSettings, useSettingsStatus } from "../useSettings";

// Mock localStorage
interface MockLocalStorage {
  store: { [key: string]: string };
  getItem: jest.MockedFunction<(key: string) => string | null>;
  setItem: jest.MockedFunction<(key: string, value: string) => void>;
  removeItem: jest.MockedFunction<(key: string) => void>;
  clear: jest.MockedFunction<() => void>;
}

const mockLocalStorage: MockLocalStorage = {
  store: {},
  getItem: jest.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete mockLocalStorage.store[key];
  }),
  clear: jest.fn(() => {
    mockLocalStorage.store = {};
  }),
};

// Replace global localStorage with our mock
Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

describe("useSettings", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  describe("Default settings", () => {
    it("should return default settings when no stored settings exist", () => {
      const { result } = renderHook(() => useSettings());

      expect(result.current.settings).toEqual({
        apiKey: "",
        llmProvider: "openai",
        temperature: 0.7,
        maxTokens: 1000,
      });
    });

    it("should indicate API key is not configured by default", () => {
      const { result } = renderHook(() => useSettings());

      expect(result.current.isApiKeyConfigured).toBe(false);
      expect(result.current.isConfigured).toBe(false);
    });
  });

  describe("API key management", () => {
    it("should update API key", () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateApiKey("test-api-key");
      });

      expect(result.current.settings.apiKey).toBe("test-api-key");
      expect(result.current.isApiKeyConfigured).toBe(true);
    });

    it("should trim API key whitespace", () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateApiKey("  test-api-key  ");
      });

      expect(result.current.settings.apiKey).toBe("test-api-key");
    });

    it("should return masked API key", () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateApiKey("sk-1234567890abcdef1234567890abcdef");
      });

      const masked = result.current.getMaskedApiKey();
      expect(masked).toBe("sk-1••••••••••••••••••••cdef");
    });

    it("should handle short API keys", () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateApiKey("short");
      });

      const masked = result.current.getMaskedApiKey();
      expect(masked).toBe("••••••••");
    });

    it("should handle empty API key", () => {
      const { result } = renderHook(() => useSettings());

      const masked = result.current.getMaskedApiKey();
      expect(masked).toBe("");
    });
  });

  describe("LLM provider management", () => {
    it("should update LLM provider", () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateLLMProvider("claude");
      });

      expect(result.current.settings.llmProvider).toBe("claude");
    });

    it("should get OpenAI provider config", () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateApiKey("test-key");
        result.current.updateLLMProvider("openai");
      });

      const config = result.current.getProviderConfig();
      expect(config.apiUrl).toBe("https://api.openai.com/v1/chat/completions");
      expect(config.model).toBe("gpt-3.5-turbo");
      expect(config.headers.Authorization).toBe("Bearer test-key");
    });

    it("should get Claude provider config", () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateApiKey("test-key");
        result.current.updateLLMProvider("claude");
      });

      const config = result.current.getProviderConfig();
      expect(config.apiUrl).toBe("https://api.anthropic.com/v1/messages");
      expect(config.model).toBe("claude-3-sonnet-20240229");
      expect(config.headers["x-api-key"]).toBe("test-key");
    });

    it("should get Gemini provider config", () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateApiKey("test-key");
        result.current.updateLLMProvider("gemini");
      });

      const config = result.current.getProviderConfig();
      expect(config.apiUrl).toContain("generativelanguage.googleapis.com");
      expect(config.apiUrl).toContain("key=test-key");
      expect(config.model).toBe("gemini-pro");
    });
  });

  describe("Temperature management", () => {
    it("should update temperature", () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateTemperature(1.2);
      });

      expect(result.current.settings.temperature).toBe(1.2);
    });

    it("should clamp temperature to valid range", () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateTemperature(3.0);
      });

      expect(result.current.settings.temperature).toBe(2.0);

      act(() => {
        result.current.updateTemperature(-1.0);
      });

      expect(result.current.settings.temperature).toBe(0.0);
    });
  });

  describe("Max tokens management", () => {
    it("should update max tokens", () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateMaxTokens(2000);
      });

      expect(result.current.settings.maxTokens).toBe(2000);
    });

    it("should clamp max tokens to valid range", () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateMaxTokens(5000);
      });

      expect(result.current.settings.maxTokens).toBe(4000);

      act(() => {
        result.current.updateMaxTokens(0);
      });

      expect(result.current.settings.maxTokens).toBe(1);
    });
  });

  describe("Bulk operations", () => {
    it("should update multiple settings", () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateSettings({
          apiKey: "new-key",
          llmProvider: "claude",
          temperature: 0.9,
        });
      });

      expect(result.current.settings.apiKey).toBe("new-key");
      expect(result.current.settings.llmProvider).toBe("claude");
      expect(result.current.settings.temperature).toBe(0.9);
      expect(result.current.settings.maxTokens).toBe(1000); // Unchanged
    });

    it("should reset settings to defaults", () => {
      const { result } = renderHook(() => useSettings());

      // First, change some settings
      act(() => {
        result.current.updateApiKey("test-key");
        result.current.updateLLMProvider("claude");
      });

      // Then reset
      act(() => {
        result.current.resetSettings();
      });

      expect(result.current.settings).toEqual({
        apiKey: "",
        llmProvider: "openai",
        temperature: 0.7,
        maxTokens: 1000,
      });
    });
  });

  describe("Validation", () => {
    it("should validate complete settings", () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateApiKey("test-key");
      });

      const validation = result.current.validateSettings();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should indicate configuration status", () => {
      const { result } = renderHook(() => useSettings());

      // Not configured initially
      expect(result.current.isConfigured).toBe(false);

      // Configure API key
      act(() => {
        result.current.updateApiKey("test-key");
      });

      expect(result.current.isConfigured).toBe(true);
    });
  });
});

describe("useSettingsStatus", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  it("should return ready status when configured", () => {
    const { result } = renderHook(() => {
      const { updateApiKey } = useSettings();
      return { updateApiKey, ...useSettingsStatus() };
    });

    expect(result.current.isReady).toBe(false);

    act(() => {
      result.current.updateApiKey("test-key");
    });

    expect(result.current.isReady).toBe(true);
    expect(result.current.isConfigured).toBe(true);
    expect(result.current.hasError).toBe(false);
  });

  it("should handle validation errors", () => {
    const { result } = renderHook(() => useSettingsStatus());

    expect(result.current.validation.isValid).toBe(false);
    expect(result.current.validation.errors).toContain("API key must be a string");
  });
});
