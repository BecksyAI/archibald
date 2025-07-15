/**
 * Unit tests for validation utilities
 */

import { validateWhiskyExperience, validateAppSettings, sanitizeString, sanitizeWhiskyExperience } from "../validation";
import { ValidationError } from "../types";

describe("Validation Utilities", () => {
  describe("validateWhiskyExperience", () => {
    const validExperience = {
      id: 1,
      whiskyDetails: {
        name: "Lagavulin 16",
        distillery: "Lagavulin",
        region: "Islay",
        age: 16,
        abv: 43.0,
        tastingNotes: ["Peat", "Smoke", "Honey"],
        caskType: "Ex-Bourbon",
        foodPairing: "Dark chocolate",
      },
      experienceDate: "2023-01-01",
      experienceLocation: "Scotland",
      narrative: "A memorable experience",
      finalVerdict: "Excellent whisky",
    };

    it("should validate a correct experience", () => {
      expect(() => validateWhiskyExperience(validExperience)).not.toThrow();
    });

    it("should throw error for null or undefined", () => {
      expect(() => validateWhiskyExperience(null)).toThrow(ValidationError);
      expect(() => validateWhiskyExperience(undefined)).toThrow(ValidationError);
    });

    it("should throw error for invalid ID", () => {
      expect(() => validateWhiskyExperience({ ...validExperience, id: 0 })).toThrow("valid positive ID");
      expect(() => validateWhiskyExperience({ ...validExperience, id: -1 })).toThrow("valid positive ID");
      expect(() => validateWhiskyExperience({ ...validExperience, id: "string" })).toThrow("valid positive ID");
    });

    it("should throw error for missing whiskyDetails", () => {
      expect(() => validateWhiskyExperience({ ...validExperience, whiskyDetails: null })).toThrow(
        "whiskyDetails object"
      );
    });

    it("should throw error for invalid whisky name", () => {
      const invalidExp = {
        ...validExperience,
        whiskyDetails: { ...validExperience.whiskyDetails, name: "" },
      };
      expect(() => validateWhiskyExperience(invalidExp)).toThrow("non-empty string");
    });

    it("should throw error for invalid age", () => {
      const invalidExp = {
        ...validExperience,
        whiskyDetails: { ...validExperience.whiskyDetails, age: -1 },
      };
      expect(() => validateWhiskyExperience(invalidExp)).toThrow("Age must be a positive number");
    });

    it('should accept "No Age Statement"', () => {
      const validExp = {
        ...validExperience,
        whiskyDetails: { ...validExperience.whiskyDetails, age: "No Age Statement" },
      };
      expect(() => validateWhiskyExperience(validExp)).not.toThrow();
    });

    it("should throw error for invalid ABV", () => {
      const invalidExp = {
        ...validExperience,
        whiskyDetails: { ...validExperience.whiskyDetails, abv: 150 },
      };
      expect(() => validateWhiskyExperience(invalidExp)).toThrow("between 0 and 100");
    });

    it("should throw error for empty tasting notes", () => {
      const invalidExp = {
        ...validExperience,
        whiskyDetails: { ...validExperience.whiskyDetails, tastingNotes: [] },
      };
      expect(() => validateWhiskyExperience(invalidExp)).toThrow("non-empty array");
    });

    it("should throw error for invalid tasting notes", () => {
      const invalidExp = {
        ...validExperience,
        whiskyDetails: { ...validExperience.whiskyDetails, tastingNotes: ["Valid", ""] },
      };
      expect(() => validateWhiskyExperience(invalidExp)).toThrow("non-empty strings");
    });
  });

  describe("validateAppSettings", () => {
    const validSettings = {
      apiKey: "test-key-123",
      llmProvider: "openai",
      temperature: 0.7,
      maxTokens: 1000,
    };

    it("should validate correct settings", () => {
      expect(() => validateAppSettings(validSettings)).not.toThrow();
    });

    it("should throw error for null or undefined", () => {
      expect(() => validateAppSettings(null)).toThrow(ValidationError);
      expect(() => validateAppSettings(undefined)).toThrow(ValidationError);
    });

    it("should throw error for invalid API key", () => {
      expect(() => validateAppSettings({ ...validSettings, apiKey: 123 })).toThrow("must be a string");
    });

    it("should throw error for invalid provider", () => {
      expect(() => validateAppSettings({ ...validSettings, llmProvider: "invalid" })).toThrow("must be one of");
    });

    it("should throw error for invalid temperature", () => {
      expect(() => validateAppSettings({ ...validSettings, temperature: 3 })).toThrow("between 0 and 2");
      expect(() => validateAppSettings({ ...validSettings, temperature: -1 })).toThrow("between 0 and 2");
    });

    it("should throw error for invalid max tokens", () => {
      expect(() => validateAppSettings({ ...validSettings, maxTokens: 0 })).toThrow("between 1 and 4000");
      expect(() => validateAppSettings({ ...validSettings, maxTokens: 5000 })).toThrow("between 1 and 4000");
    });
  });

  describe("sanitizeString", () => {
    it("should trim whitespace", () => {
      expect(sanitizeString("  hello  ")).toBe("hello");
    });

    it("should remove dangerous characters", () => {
      expect(sanitizeString('hello<script>alert("xss")</script>world')).toBe('helloscriptalert("xss")/scriptworld');
    });

    it("should handle empty strings", () => {
      expect(sanitizeString("")).toBe("");
      expect(sanitizeString("   ")).toBe("");
    });
  });

  describe("sanitizeWhiskyExperience", () => {
    const validExperience = {
      id: 1,
      whiskyDetails: {
        name: "  Lagavulin 16  ",
        distillery: "Lagavulin",
        region: "Islay",
        age: 16,
        abv: 43.0,
        tastingNotes: ["  Peat  ", "Smoke", "Honey"],
        caskType: "Ex-Bourbon",
        foodPairing: "Dark chocolate",
      },
      experienceDate: "2023-01-01",
      experienceLocation: "Scotland",
      narrative: "A memorable experience",
      finalVerdict: "Excellent whisky",
    };

    it("should sanitize all string fields", () => {
      const sanitized = sanitizeWhiskyExperience(validExperience);
      expect(sanitized.whiskyDetails.name).toBe("Lagavulin 16");
      expect(sanitized.whiskyDetails.tastingNotes[0]).toBe("Peat");
    });

    it("should preserve non-string fields", () => {
      const sanitized = sanitizeWhiskyExperience(validExperience);
      expect(sanitized.id).toBe(1);
      expect(sanitized.whiskyDetails.age).toBe(16);
      expect(sanitized.whiskyDetails.abv).toBe(43.0);
    });
  });
});
