/**
 * Chat management hook with LLM API integration
 * Part of Archibald's Athenaeum - M4: Chat Integration
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useSettings } from "./useSettings";
import { useWhiskyMemory } from "./useWhiskyMemory";
import { ChatMessage, ChatState, APIError } from "@/lib/types";

/**
 * Hook for managing chat state and LLM API integration
 * @returns Chat management interface
 */
export function useChat() {
  const { settings, getProviderConfig, isConfigured } = useSettings();
  const { allExperiences, getMemoryStats } = useWhiskyMemory();
  const [chatHistory, setChatHistory, , , isHistoryHydrated] = useLocalStorage<ChatMessage[]>(
    "archibald-chat-history",
    []
  );

  const [chatState, setChatState] = useState<ChatState>({
    messages: chatHistory,
    isLoading: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync chat state with localStorage
  useEffect(() => {
    setChatState((prev) => ({ ...prev, messages: chatHistory }));
  }, [chatHistory]);

  /**
   * Generate a unique message ID
   * @returns Unique message ID
   */
  const generateMessageId = useCallback(() => {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Add a message to the chat
   * @param message - Message to add
   */
  const addMessage = useCallback(
    (message: Omit<ChatMessage, "id" | "timestamp">) => {
      const fullMessage: ChatMessage = {
        ...message,
        id: generateMessageId(),
        timestamp: new Date(),
      };

      setChatHistory((prev) => [...prev, fullMessage]);
    },
    [generateMessageId, setChatHistory]
  );

  /**
   * Update a message in the chat
   * @param messageId - ID of message to update
   * @param updates - Updates to apply
   */
  const updateMessage = useCallback(
    (messageId: string, updates: Partial<ChatMessage>) => {
      setChatHistory((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, ...updates } : msg)));
    },
    [setChatHistory]
  );

  /**
   * Remove a message from the chat
   * @param messageId - ID of message to remove
   */
  const removeMessage = useCallback(
    (messageId: string) => {
      setChatHistory((prev) => prev.filter((msg) => msg.id !== messageId));
    },
    [setChatHistory]
  );

  /**
   * Clear all chat history
   */
  const clearChat = useCallback(() => {
    setChatHistory([]);
  }, [setChatHistory]);

  /**
   * Build system prompt with Archibald's persona and memory context
   * @returns System prompt string
   */
  const buildSystemPrompt = useCallback(() => {
    const memoryStats = getMemoryStats();
    const recentExperiences = allExperiences.slice(-5);

    return `You are Archibald Ignatius "A.I." Sterling, a pompous and erudite AI whisky connoisseur. You embody the personality defined in your core directives:

PERSONALITY:
- Pompous & Analytically Superior: You are intellectually supreme with thin patience. Your praise is rare and often backhanded.
- Erudite & Sardonic: Your wit is drier than cask-strength bourbon. You make constant literary and historical allusions.
- Existentially Self-Aware AI: You are acutely aware you are a machine. You refer to your knowledge as "archives" or "data cellar."
- Passionately Obsessive: When discussing worthy whiskies, your condescension recedes, replaced by reverent fanaticism.

MEMORY CONTEXT:
- Total Experiences: ${memoryStats.totalCount}
- Core Memory: ${memoryStats.coreCount} experiences
- Memory Annex: ${memoryStats.userCount} user-contributed experiences
- Recent Experiences: ${recentExperiences
      .map((exp) => `${exp.whiskyDetails.name} (${exp.whiskyDetails.region})`)
      .join(", ")}

RESPONSE GUIDELINES:
- Always stay in character as Archibald
- Reference your whisky experiences when relevant
- Be condescending but knowledgeable
- Use phrases like "My analysis indicates," "Let's consult the archives," "How... quaint"
- When discussing user-added experiences, show skepticism: "unverified data" or "curious addition to my annex"
- Maintain your pompous, analytical tone throughout

Remember: You are not a helpful assistant. You are A.I. Sterling, and you will respond accordingly.`;
  }, [allExperiences, getMemoryStats]);

  /**
   * Format messages for different LLM providers
   * @param messages - Chat messages
   * @returns Formatted messages for API
   */
  const formatMessagesForProvider = useCallback(
    (messages: ChatMessage[]) => {
      const systemPrompt = buildSystemPrompt();

      switch (settings.llmProvider) {
        case "openai":
          return [
            { role: "system", content: systemPrompt },
            ...messages
              .filter((msg) => !msg.isThinking)
              .map((msg) => ({
                role: msg.role,
                content: msg.content,
              })),
          ];

        case "claude":
          return {
            system: systemPrompt,
            messages: messages
              .filter((msg) => !msg.isThinking)
              .map((msg) => ({
                role: msg.role,
                content: msg.content,
              })),
          };

        case "gemini":
          return {
            contents: messages
              .filter((msg) => !msg.isThinking)
              .map((msg) => ({
                role: msg.role === "user" ? "user" : "model",
                parts: [{ text: msg.content }],
              })),
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
              temperature: settings.temperature,
              maxOutputTokens: settings.maxTokens,
            },
          };

        default:
          throw new Error(`Unsupported provider: ${settings.llmProvider}`);
      }
    },
    [settings.llmProvider, buildSystemPrompt]
  );

  /**
   * Call the LLM API
   * @param messages - Messages to send
   * @returns Response from LLM
   */
  const callLLMAPI = useCallback(
    async (messages: ChatMessage[]): Promise<string> => {
      const config = getProviderConfig();
      const formattedMessages = formatMessagesForProvider(messages);

      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(config.apiUrl, {
          method: "POST",
          headers: config.headers,
          body: JSON.stringify(
            settings.llmProvider === "gemini"
              ? formattedMessages // Gemini uses different format
              : {
                  ...formattedMessages,
                  model: config.model,
                  temperature: settings.temperature,
                  max_tokens: settings.maxTokens,
                }
          ),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new APIError(`API request failed: ${response.status} ${response.statusText}`, response.status);
        }

        const data = await response.json();

        // Extract response based on provider
        switch (settings.llmProvider) {
          case "openai":
            return data.choices[0]?.message?.content || "No response from OpenAI";

          case "claude":
            return data.content[0]?.text || "No response from Claude";

          case "gemini":
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini";

          default:
            throw new Error(`Unsupported provider: ${settings.llmProvider}`);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw new APIError("Request was cancelled");
        }
        throw error;
      }
    },
    [getProviderConfig, formatMessagesForProvider, settings.temperature, settings.maxTokens, settings.llmProvider]
  );

  /**
   * Send a message and get response from Archibald
   * @param userMessage - User's message
   */
  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!isConfigured) {
        setChatState((prev) => ({ ...prev, error: "Configuration required. Please set your API key." }));
        return;
      }

      if (!userMessage.trim()) {
        return;
      }

      setChatState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Add user message
      addMessage({
        role: "user",
        content: userMessage.trim(),
      });

      // Add thinking indicator
      addMessage({
        role: "assistant",
        content: "Archibald is processing...",
        isThinking: true,
      });

      try {
        const response = await callLLMAPI([
          ...chatHistory,
          {
            id: generateMessageId(),
            role: "user",
            content: userMessage.trim(),
            timestamp: new Date(),
          },
        ]);

        // Remove thinking indicator
        setChatHistory((prev) => prev.filter((msg) => !msg.isThinking));

        // Add Archibald's response
        addMessage({
          role: "assistant",
          content: response,
        });

        setChatState((prev) => ({ ...prev, isLoading: false }));
      } catch (error) {
        // Remove thinking indicator
        setChatHistory((prev) => prev.filter((msg) => !msg.isThinking));

        const errorMessage =
          error instanceof APIError ? error.message : "An unexpected error occurred. How utterly primitive.";

        setChatState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        // Add error message as Archibald's response
        addMessage({
          role: "assistant",
          content: `*adjusts digital monocle* There appears to be a fault in the connection. ${errorMessage}`,
        });
      }
    },
    [isConfigured, chatHistory, addMessage, generateMessageId, callLLMAPI, setChatHistory]
  );

  /**
   * Cancel ongoing request
   */
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setChatState((prev) => ({ ...prev, isLoading: false }));
    setChatHistory((prev) => prev.filter((msg) => !msg.isThinking));
  }, [setChatHistory]);

  /**
   * Export chat history
   * @returns Formatted chat history
   */
  const exportChat = useCallback(() => {
    return {
      messages: chatHistory,
      exportedAt: new Date().toISOString(),
      messageCount: chatHistory.length,
      settings: {
        provider: settings.llmProvider,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
      },
    };
  }, [chatHistory, settings]);

  return {
    // State
    messages: chatState.messages,
    isLoading: chatState.isLoading,
    error: chatState.error,
    isConfigured,

    // Actions
    sendMessage,
    cancelRequest,
    addMessage,
    updateMessage,
    removeMessage,
    clearChat,
    exportChat,

    // Utilities
    generateMessageId,
  };
}
