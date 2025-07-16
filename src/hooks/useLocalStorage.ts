/**
 * Type-safe localStorage abstraction with error handling
 * Part of Archibald's Athenaeum - M2: Core Logic & Hooks
 */

import { useState, useEffect, useCallback } from "react";
import { StorageError } from "@/lib/types";

// Simple encryption/decryption for sensitive data (API keys)
const ENCRYPTION_KEY = "archibald-athenaeum-key";

/**
 * Simple XOR encryption for API keys stored in localStorage
 * @param text - Text to encrypt/decrypt
 * @returns Encrypted/decrypted text
 */
function simpleEncrypt(text: string): string {
  return text
    .split("")
    .map((char, index) =>
      String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length))
    )
    .join("");
}

/**
 * Type-safe localStorage hook with error handling and optional encryption
 * @param key - The localStorage key
 * @param initialValue - Initial value if key doesn't exist
 * @param encrypt - Whether to encrypt the value (for sensitive data like API keys)
 * @returns [value, setValue, error, clearValue]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  encrypt: boolean = false
): [T, (value: T | ((prev: T) => T)) => void, string | null, () => void, boolean] {
  // Always start with initial value during SSR to prevent hydration mismatch
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on client-side after SSR
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        const parsedItem = encrypt ? simpleEncrypt(item) : item;
        const parsedValue = JSON.parse(parsedItem);
        setStoredValue(parsedValue);
      }
      setIsHydrated(true);
    } catch (err) {
      console.error(`[useLocalStorage] Error hydrating key "${key}":`, err);
      setIsHydrated(true);
    }
  }, [key, encrypt]); // Only run on mount and when key/encrypt changes

  // FIX: Decouple localStorage persistence from state updates to prevent race conditions.
  // This effect now runs *after* the state has been updated.
  useEffect(() => {
    // Skip localStorage access during SSR or before hydration
    if (typeof window === "undefined" || !isHydrated) return;

    try {
      const serializedValue = JSON.stringify(storedValue);
      const finalValue = encrypt ? simpleEncrypt(serializedValue) : serializedValue;
      window.localStorage.setItem(key, finalValue);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to write to localStorage";
      setError(message);
      console.error(`[useLocalStorage] Error writing key "${key}":`, err);
    }
  }, [key, storedValue, encrypt, isHydrated]);

  /**
   * Clear the stored value
   */
  const clearValue = useCallback(() => {
    if (typeof window === "undefined") {
      setStoredValue(initialValue);
      return;
    }

    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to clear localStorage";
      setError(message);
      console.error(`[useLocalStorage] Error clearing key "${key}":`, err);
      throw new StorageError(message);
    }
  }, [key, initialValue]);

  // Return the actual state setter from useState, which is guaranteed to be stable
  // and handle functional updates correctly.
  return [storedValue, setStoredValue, error, clearValue, isHydrated];
}

/**
 * Check if localStorage is available in the current environment
 * @returns Whether localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const test = "__localStorage_test__";
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the current localStorage usage stats
 * @returns Object with used and total storage information
 */
export function getStorageStats(): { used: number; total: number; percentage: number } {
  if (typeof window === "undefined") {
    return { used: 0, total: 0, percentage: 0 };
  }

  try {
    let used = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }

    // Most browsers have a 5MB limit for localStorage
    const total = 5 * 1024 * 1024; // 5MB in bytes
    const percentage = (used / total) * 100;

    return { used, total, percentage };
  } catch {
    return { used: 0, total: 0, percentage: 0 };
  }
}
