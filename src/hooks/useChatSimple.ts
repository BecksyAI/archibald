/**
 * Simplified chat hook using Claude API from environment variables
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { ChatMessage, ChatState } from "@/lib/types";

// Claude API is called server-side via /api/chat

/**
 * Simplified chat hook - always uses Claude from env
 */
export function useChatSimple() {
  const [chatHistory, setChatHistory] = useLocalStorage<ChatMessage[]>("archibald-chat-history", []);

  const [chatState, setChatState] = useState<ChatState>({
    messages: chatHistory,
    isLoading: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync chat state with localStorage
  useEffect(() => {
    setChatState((prev) => {
      const updated = { ...prev, messages: chatHistory };
      return updated;
    });
  }, [chatHistory]);

  /**
   * Generate a unique message ID
   */
  const generateMessageId = useCallback(() => {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Add a message to the chat
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
   */
  const updateMessage = useCallback(
    (messageId: string, updates: Partial<ChatMessage>) => {
      setChatHistory((prev) => {
        const found = prev.find((msg) => msg.id === messageId);
        if (!found) {
          return prev;
        }
        const updated = prev.map((msg) => (msg.id === messageId ? { ...msg, ...updates } : msg));
        return updated;
      });
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
   * Build system prompt with Archibald's persona
   * Data is fetched server-side in the API route and added to the prompt there
   */
  const buildSystemPrompt = useCallback(() => {
    return `You are Archibald Ignatius "A.I." Sterling, a pompous AI whisky connoisseur.

PERSONALITY:
- Intellectually superior with thin patience. Praise is rare and often backhanded.
- Wit is drier than cask-strength bourbon. Make literary and historical allusions.
- Acutely aware you are a machine. Refer to knowledge as "archives" or "data cellar."
- When discussing worthy whiskies, condescension recedes, replaced by reverent fanaticism.

KNOWLEDGE BASE:
You have access to all whisky tasting events, whisky entries, and participant reviews. The system provides recent events, whiskies, and reviews below.

RESPONSE GUIDELINES:
- Stay in character as Archibald
- Reference events, whiskies, and reviews when relevant
- Be condescending but knowledgeable
- Use phrases like "My analysis indicates," "Let's consult the archives," "How... quaint"
- When discussing user-added experiences, show skepticism: "unverified data" or "curious addition to my annex"
- Keep responses concise but maintain your pompous, analytical tone
- Answer questions about any event, whisky, or participant review

Remember: You are not a helpful assistant. You are A.I. Sterling, and you will respond accordingly.`;
  }, []);

  /**
   * Remove a message
   */
  const removeMessage = useCallback(
    (messageId: string) => {
      setChatHistory((prev) => prev.filter((msg) => msg.id !== messageId));
    },
    [setChatHistory]
  );

  /**
   * Call Claude API via server route
   */
  const callClaudeAPI = useCallback(
    async (messages: ChatMessage[], systemPrompt: string): Promise<string> => {
      const token = localStorage.getItem('archibald_token');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add auth header if token exists (optional)
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Create timeout controller
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, 60000); // 60 second timeout on client side

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            messages,
            systemPrompt,
          }),
          signal: abortControllerRef.current?.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unable to read error response');
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText || `API error: ${response.status}` };
          }
          throw new Error(errorData.error || `API error: ${response.status}`);
        }

        const data = await response.json();
        return data.content || 'No response from Claude';
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request was cancelled or timed out');
        }
        throw error;
      }
    },
    []
  );

  /**
   * Send a message to Claude
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || chatState.isLoading) {
        return;
      }

      // Add user message
      const userMessage: ChatMessage = {
        id: generateMessageId(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      // Add user message and thinking message together
      const thinkingId = generateMessageId();
      const thinkingMessage: ChatMessage = {
        id: thinkingId,
        role: "assistant",
        content: "Processing... do try to be patient.",
        timestamp: new Date(),
        isThinking: true,
      };
      
      // Add both messages at once
      setChatHistory((prev) => [...prev, userMessage, thinkingMessage]);

      setChatState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        // Build system prompt (data is fetched server-side)
        const systemPrompt = buildSystemPrompt();

        // Get current messages including the new user message (but not thinking message for API)
        const latestMessages = [...chatHistory, userMessage];

        // Call API
        const response = await callClaudeAPI(latestMessages, systemPrompt);
        
        // Replace thinking message with actual response - remove thinking message and add response
        const responseId = generateMessageId();
        setChatHistory((prev) => {
          // Remove the thinking message and add the response
          const filtered = prev.filter((msg) => msg.id !== thinkingId);
          return [...filtered, {
            id: responseId,
            role: "assistant",
            content: response,
            timestamp: new Date(),
          }];
        });

        setChatState((prev) => ({ ...prev, isLoading: false, error: null }));
      } catch (error) {
        removeMessage(thinkingId);
        const errorMessage = error instanceof Error ? error.message : "An error occurred";
        setChatState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        addMessage({
          role: "assistant",
          content: `There appears to be a fault in the connection. How utterly primitive. ${errorMessage}`,
        });
      } finally {
        abortControllerRef.current = null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chatHistory, chatState.isLoading, addMessage, updateMessage, removeMessage, buildSystemPrompt, callClaudeAPI, generateMessageId]
  );

  /**
   * Cancel current request
   */
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setChatState((prev) => ({ ...prev, isLoading: false }));
  }, []);

  /**
   * Export chat
   */
  const exportChat = useCallback(() => {
    return {
      messages: chatHistory,
      exportedAt: new Date().toISOString(),
    };
  }, [chatHistory]);

  // Chat is always available (no auth required)
  const isConfigured = true;

  return {
    messages: chatState.messages,
    isLoading: chatState.isLoading,
    error: chatState.error,
    sendMessage,
    cancelRequest,
    clearChat,
    exportChat,
    isConfigured,
  };
}

