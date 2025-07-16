/**
 * Chat interface component for conversing with Archibald
 * Part of Archibald's Athenaeum - M4: Chat Integration
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { useSettings } from "@/hooks/useSettings";

interface ChatInterfaceProps {
  className?: string;
  isConfigured: boolean; // Add prop to receive config status
  settingsVersion?: number; // Add prop to force re-renders when settings change
}

/**
 * Main chat interface component
 * @param props - Component props
 * @returns ChatInterface component
 */
export function ChatInterface({ className }: ChatInterfaceProps) {
  const { messages, isLoading, error, sendMessage, cancelRequest, clearChat, exportChat } = useChat();

  // Get isConfigured directly from useSettings hook to ensure we have the latest state
  const { isConfigured: directIsConfigured } = useSettings();

  // Use the most current state - prefer direct state when available
  const effectiveIsConfigured = directIsConfigured;

  const [inputMessage, setInputMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-focus input when component mounts or becomes configured
  useEffect(() => {
    if (effectiveIsConfigured && !isLoading) {
      inputRef.current?.focus();
    }
  }, [effectiveIsConfigured, isLoading]);

  // Auto-focus input when not submitting
  useEffect(() => {
    if (!isSubmitting && effectiveIsConfigured) {
      inputRef.current?.focus();
    }
  }, [isSubmitting, effectiveIsConfigured]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await sendMessage(inputMessage.trim());
      setInputMessage("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleCancel = () => {
    cancelRequest();
    setIsSubmitting(false);
  };

  const handleExportChat = () => {
    exportChat();
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear the chat history?")) {
      clearChat();
    }
  };

  if (!effectiveIsConfigured) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="w-16 h-16 bg-amber-dram/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-amber-dram mb-2">Configuration Required</h2>
            <p className="text-limestone">
              Please configure your API key in the sidebar settings to begin conversing with Archibald.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Chat Header */}
      <div className="flex-shrink-0 bg-charcoal-grey/50 border-b border-limestone/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-dram/20 rounded-full flex items-center justify-center">
              <span className="text-amber-dram font-bold">A</span>
            </div>
            <div>
              <h2 className="font-bold text-parchment">Archibald I. Sterling</h2>
              <p className="text-sm text-limestone">Your Personal Whisky Connoisseur</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportChat}
              className="px-3 py-1 text-sm bg-limestone/10 hover:bg-limestone/20 text-limestone border border-limestone/20 rounded transition-colors"
              title="Export Chat"
            >
              Export
            </button>
            <button
              onClick={handleClearChat}
              className="px-3 py-1 text-sm bg-red-900/20 hover:bg-red-900/30 text-red-300 border border-red-900/20 rounded transition-colors"
              title="Clear Chat"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-amber-dram/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🥃</span>
            </div>
            <h3 className="text-lg font-semibold text-parchment mb-2">Welcome to Archibald&apos;s Athenaeum</h3>
            <p className="text-limestone max-w-md mx-auto">
              Greetings! I&apos;m Archibald Ignatius Sterling, your personal whisky connoisseur. Ask me anything about
              whisky, from tastings to recommendations, and I&apos;ll share my expertise with you.
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === "user"
                    ? "bg-amber-dram/20 text-parchment"
                    : "bg-charcoal-grey/50 text-parchment border border-limestone/20"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 bg-amber-dram/20 rounded-full flex items-center justify-center">
                      <span className="text-amber-dram text-sm font-bold">A</span>
                    </div>
                    <span className="text-sm font-medium text-amber-dram">Archibald</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-4 bg-charcoal-grey/50 text-parchment border border-limestone/20">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-amber-dram/20 rounded-full flex items-center justify-center">
                  <span className="text-amber-dram text-sm font-bold">A</span>
                </div>
                <span className="text-sm font-medium text-amber-dram">Archibald</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-amber-dram/60 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-amber-dram/60 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-amber-dram/60 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className="text-sm text-limestone">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="max-w-md rounded-lg p-4 bg-red-900/20 text-red-300 border border-red-900/20">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-red-400">⚠️</span>
                <span className="font-medium">Error</span>
              </div>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 bg-charcoal-grey/50 border-t border-limestone/20 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Archibald about whisky..."
            className="flex-1 bg-peat-smoke border border-limestone/20 rounded-lg px-4 py-2 text-parchment placeholder-limestone/60 focus:outline-none focus:ring-2 focus:ring-amber-dram focus:border-transparent"
            disabled={isLoading || isSubmitting}
          />
          {isLoading || isSubmitting ? (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-red-900/20 hover:bg-red-900/30 text-red-300 border border-red-900/20 rounded-lg transition-colors"
            >
              Cancel
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="px-4 py-2 bg-amber-dram hover:bg-amber-dram/90 text-peat-smoke font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
