/**
 * Chat interface component for conversing with Archibald
 * Part of Archibald's Athenaeum - M4: Chat Integration
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, X, Download, Trash2, AlertCircle } from "lucide-react";
import { useChatSimple } from "@/hooks/useChatSimple";
import { ChatMessage } from "@/lib/types";

interface ChatInterfaceProps {
  className?: string;
}

/**
 * Main chat interface component
 * @param props - Component props
 * @returns ChatInterface component
 */
export function ChatInterface({ className }: ChatInterfaceProps) {
  const { messages, isLoading, error, sendMessage, cancelRequest, clearChat, exportChat } = useChatSimple();

  const [inputMessage, setInputMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await sendMessage(inputMessage);
      setInputMessage("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleExport = () => {
    const chatData = exportChat();
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `archibald-chat-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearChat = () => {
    if (window.confirm("Are you certain you wish to clear our conversation history? This action cannot be undone.")) {
      clearChat();
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Chat Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-aged-oak dark:bg-aged-oak bg-light-surface border-b border-gray-700 dark:border-gray-700 border-light-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-parchment">Conversation with Archibald</h1>
            <p className="text-limestone text-sm">
              {messages.length === 0
                ? "Begin your discourse with the connoisseur"
                : `${messages.length} messages exchanged`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={messages.length === 0}
              className="p-2 text-limestone hover:text-parchment disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Export conversation"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={handleClearChat}
              disabled={messages.length === 0}
              className="p-2 text-limestone hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Clear conversation"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h2 className="font-serif text-xl font-semibold text-parchment mb-4">Welcome to the Athenaeum</h2>
              <p className="text-limestone mb-6">
                Archibald awaits your queries about whisky, spirits, and the finer things in life. Be prepared for his
                characteristically pompous responses.
              </p>
              <div className="text-sm text-limestone/70">
                <p>Try asking about:</p>
                <ul className="mt-2 space-y-1">
                  <li>• His favorite whiskies</li>
                  <li>• Recommendations for beginners</li>
                  <li>• The history of Scottish distilleries</li>
                  <li>• His thoughts on your whisky choices</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {messages.map((message) => (
              <ChatMessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex-shrink-0 px-6 py-2 bg-red-900/20 border-t border-red-400/50">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Chat Input */}
      <div className="flex-shrink-0 p-6 bg-aged-oak dark:bg-aged-oak bg-light-surface border-t border-gray-700 dark:border-gray-700 border-light-border">
        <form onSubmit={handleSubmit} className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Compose your query..."
            disabled={isSubmitting}
            className="w-full bg-gray-900 dark:bg-gray-900 bg-white border border-gray-700 dark:border-gray-700 border-light-border rounded-lg py-3 pl-4 pr-28 text-parchment dark:text-parchment text-light-text focus:ring-2 focus:ring-amber-dram focus:border-amber-dram transition disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {isLoading && (
              <button
                type="button"
                onClick={cancelRequest}
                className="p-2 text-limestone hover:text-red-400 transition-colors"
                title="Cancel request"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={!inputMessage.trim() || isSubmitting}
              className="bg-amber-dram text-parchment font-semibold py-2 px-4 rounded-lg hover:bg-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <span className="hidden sm:inline">Send</span>
              <Send className="h-4 w-4 sm:ml-2" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

/**
 * Individual chat message bubble component
 * @param props - Component props
 * @returns ChatMessageBubble component
 */
function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === "user";
  const isThinking = message.isThinking;

  const formatTime = (date: Date | string) => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        return "Invalid time";
      }
      return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(dateObj);
    } catch {
      return "Invalid time";
    }
  };

  if (isUser) {
    return (
      <div className="flex items-start gap-4 justify-end">
        <div className="order-1 max-w-xl bg-gray-700 dark:bg-gray-700 bg-gray-200 p-4 rounded-lg">
          <p className="text-parchment whitespace-pre-wrap">{message.content}</p>
          <div className="text-xs text-limestone/70 mt-2">{formatTime(message.timestamp)}</div>
        </div>
        <div className="order-2 flex-shrink-0 h-10 w-10 rounded-full bg-limestone/20 flex items-center justify-center font-semibold text-parchment">
          U
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-amber-dram/20 flex items-center justify-center font-serif text-amber-dram font-bold">
        A.I.
      </div>
      <div className="max-w-xl bg-aged-oak dark:bg-aged-oak bg-light-surface border-l-2 border-amber-dram p-4 rounded-lg shadow-md">
        {isThinking ? (
          <div className="flex items-center space-x-2">
            <span className="text-limestone italic">Processing... do try to be patient.</span>
            <div className="h-2 w-2 bg-amber-dram rounded-full animate-pulse [animation-delay:-0.3s]"></div>
            <div className="h-2 w-2 bg-amber-dram rounded-full animate-pulse [animation-delay:-0.15s]"></div>
            <div className="h-2 w-2 bg-amber-dram rounded-full animate-pulse"></div>
          </div>
        ) : (
          <>
            <p className="text-parchment dark:text-parchment text-light-text whitespace-pre-wrap">{message.content}</p>
            <div className="text-xs text-limestone/70 mt-2">{formatTime(message.timestamp)}</div>
          </>
        )}
      </div>
    </div>
  );
}
