/**
 * Core type definitions for Archibald's Athenaeum
 */

export interface WhiskyExperience {
  id: number;
  whiskyDetails: {
    name: string;
    distillery: string;
    region: string;
    age: number | "No Age Statement";
    abv: number;
    tastingNotes: string[];
    caskType: string;
    foodPairing: string;
  };
  experienceDate: string;
  experienceLocation: string;
  narrative: string;
  finalVerdict: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isThinking?: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

export interface AppSettings {
  apiKey: string;
  llmProvider: "openai" | "claude" | "gemini";
  temperature: number;
  maxTokens: number;
}

export interface MemoryAnnex {
  userExperiences: WhiskyExperience[];
  lastUpdated: Date;
}

export type LLMProvider = "openai" | "claude" | "gemini";

export interface ConnoisseurOpinion {
  score: number; // 0-100
  reasoning: string;
  lastUpdated: Date;
}

export interface LocalStorageData {
  settings: AppSettings;
  memoryAnnex: MemoryAnnex;
  chatHistory: ChatMessage[];
  connoisseurOpinion: ConnoisseurOpinion;
}

export type LocalStorageKey = keyof LocalStorageData;

// Error types
export class ArchibaldError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "ArchibaldError";
  }
}

export class StorageError extends ArchibaldError {
  constructor(message: string) {
    super(message, "STORAGE_ERROR");
  }
}

export class APIError extends ArchibaldError {
  constructor(message: string, public statusCode?: number) {
    super(message, "API_ERROR");
  }
}

export class ValidationError extends ArchibaldError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
  }
}
