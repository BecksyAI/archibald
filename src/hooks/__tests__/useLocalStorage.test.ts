/**
 * Unit tests for useLocalStorage hook
 */

import { renderHook, act } from "@testing-library/react";
import { useLocalStorage, isLocalStorageAvailable, getStorageStats } from "../useLocalStorage";

// Mock localStorage
const mockLocalStorage = {
  store: {} as { [key: string]: string },
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

describe("useLocalStorage", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  describe("Basic functionality", () => {
    it("should return initial value when no stored value exists", () => {
      const { result } = renderHook(() => useLocalStorage("test-key", "initial"));

      expect(result.current[0]).toBe("initial");
      expect(result.current[2]).toBeNull(); // No error
    });

    it("should return stored value when it exists", () => {
      mockLocalStorage.setItem("test-key", JSON.stringify("stored-value"));

      const { result } = renderHook(() => useLocalStorage("test-key", "initial"));

      expect(result.current[0]).toBe("stored-value");
    });

    it("should store value when setValue is called", () => {
      const { result } = renderHook(() => useLocalStorage("test-key", "initial"));

      act(() => {
        result.current[1]("new-value");
      });

      expect(result.current[0]).toBe("new-value");
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("test-key", JSON.stringify("new-value"));
    });

    it("should handle function updates", () => {
      const { result } = renderHook(() => useLocalStorage("test-key", 5));

      act(() => {
        result.current[1]((prev) => prev + 1);
      });

      expect(result.current[0]).toBe(6);
    });

    it("should clear value when clearValue is called", () => {
      mockLocalStorage.setItem("test-key", JSON.stringify("stored-value"));

      const { result } = renderHook(() => useLocalStorage("test-key", "initial"));

      act(() => {
        result.current[3](); // clearValue
      });

      expect(result.current[0]).toBe("initial");
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("test-key");
    });
  });

  describe("Encryption", () => {
    it("should encrypt and decrypt values when encrypt=true", () => {
      const { result } = renderHook(() => useLocalStorage("test-key", "secret", true));

      act(() => {
        result.current[1]("encrypted-value");
      });

      expect(result.current[0]).toBe("encrypted-value");

      // The stored value should be encrypted (different from original)
      const storedValue = mockLocalStorage.store["test-key"];
      expect(storedValue).not.toContain("encrypted-value");
      expect(storedValue).toBeDefined();
    });

    it("should handle encrypted values on initialization", () => {
      // First, store an encrypted value
      const { result: result1 } = renderHook(() => useLocalStorage("test-key", "", true));

      act(() => {
        result1.current[1]("secret-data");
      });

      // Then, create a new hook instance and verify it can decrypt
      const { result: result2 } = renderHook(() => useLocalStorage("test-key", "", true));

      expect(result2.current[0]).toBe("secret-data");
    });
  });

  describe("Error handling", () => {
    it("should handle localStorage read errors", () => {
      mockLocalStorage.getItem.mockImplementationOnce(() => {
        throw new Error("Read error");
      });

      const { result } = renderHook(() => useLocalStorage("test-key", "initial"));

      expect(result.current[0]).toBe("initial");
      expect(result.current[2]).toBe("Read error");
    });

    it("should handle localStorage write errors", () => {
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error("Write error");
      });

      const { result } = renderHook(() => useLocalStorage("test-key", "initial"));

      act(() => {
        expect(() => result.current[1]("new-value")).toThrow("Write error");
      });

      expect(result.current[2]).toBe("Write error");
    });

    it("should handle localStorage clear errors", () => {
      mockLocalStorage.removeItem.mockImplementationOnce(() => {
        throw new Error("Clear error");
      });

      const { result } = renderHook(() => useLocalStorage("test-key", "initial"));

      act(() => {
        expect(() => result.current[3]()).toThrow("Clear error");
      });

      expect(result.current[2]).toBe("Clear error");
    });
  });

  describe("Complex data types", () => {
    it("should handle objects", () => {
      const initialObject = { name: "John", age: 30 };
      const { result } = renderHook(() => useLocalStorage("test-key", initialObject));

      const newObject = { name: "Jane", age: 25 };
      act(() => {
        result.current[1](newObject);
      });

      expect(result.current[0]).toEqual(newObject);
    });

    it("should handle arrays", () => {
      const initialArray = [1, 2, 3];
      const { result } = renderHook(() => useLocalStorage("test-key", initialArray));

      const newArray = [4, 5, 6];
      act(() => {
        result.current[1](newArray);
      });

      expect(result.current[0]).toEqual(newArray);
    });
  });
});

describe("localStorage utility functions", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  describe("isLocalStorageAvailable", () => {
    it("should return true when localStorage is available", () => {
      expect(isLocalStorageAvailable()).toBe(true);
    });

    it("should return false when localStorage throws an error", () => {
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error("Storage not available");
      });

      expect(isLocalStorageAvailable()).toBe(false);
    });
  });

  describe("getStorageStats", () => {
    it("should return storage statistics", () => {
      mockLocalStorage.store = {
        key1: "value1",
        key2: "value2",
      };

      const stats = getStorageStats();

      expect(stats.used).toBeGreaterThan(0);
      expect(stats.total).toBe(5 * 1024 * 1024); // 5MB
      expect(stats.percentage).toBeGreaterThan(0);
    });

    it("should handle errors gracefully", () => {
      // Mock localStorage to throw an error
      Object.defineProperty(window, "localStorage", {
        value: {
          ...mockLocalStorage,
          get length() {
            throw new Error("Storage error");
          },
        },
        writable: true,
      });

      const stats = getStorageStats();

      expect(stats.used).toBe(0);
      expect(stats.total).toBe(0);
      expect(stats.percentage).toBe(0);
    });
  });
});
