/**
 * Data validation utilities for Archibald's Athenaeum
 */

import { WhiskyExperience, AppSettings, ValidationError } from "./types";

/**
 * Validates a WhiskyExperience object against the schema
 * @param experience - The experience object to validate
 * @returns The validated experience object
 * @throws ValidationError if validation fails
 */
export function validateWhiskyExperience(experience: unknown): WhiskyExperience {
  if (!experience || typeof experience !== "object") {
    throw new ValidationError("Experience must be an object");
  }

  const exp = experience as Record<string, unknown>;

  // Validate required fields
  if (typeof exp.id !== "number" || exp.id <= 0) {
    throw new ValidationError("Experience must have a valid positive ID");
  }

  if (!exp.whiskyDetails || typeof exp.whiskyDetails !== "object") {
    throw new ValidationError("Experience must have whiskyDetails object");
  }

  const details = exp.whiskyDetails as Record<string, unknown>;

  // Validate whisky details
  if (typeof details.name !== "string" || details.name.trim() === "") {
    throw new ValidationError("Whisky name must be a non-empty string");
  }

  if (typeof details.distillery !== "string" || details.distillery.trim() === "") {
    throw new ValidationError("Distillery must be a non-empty string");
  }

  if (typeof details.region !== "string" || details.region.trim() === "") {
    throw new ValidationError("Region must be a non-empty string");
  }

  if (details.age !== "No Age Statement" && (typeof details.age !== "number" || details.age <= 0)) {
    throw new ValidationError('Age must be a positive number or "No Age Statement"');
  }

  if (typeof details.abv !== "number" || details.abv <= 0 || details.abv > 100) {
    throw new ValidationError("ABV must be a number between 0 and 100");
  }

  // Validate other required fields
  if (typeof exp.experienceDate !== "string" || exp.experienceDate.trim() === "") {
    throw new ValidationError("Experience date must be a non-empty string");
  }

  if (typeof exp.experienceLocation !== "string" || exp.experienceLocation.trim() === "") {
    throw new ValidationError("Experience location must be a non-empty string");
  }

  if (!Array.isArray(details.tastingNotes) || details.tastingNotes.length === 0) {
    throw new ValidationError("Tasting notes must be a non-empty array");
  }

  if (typeof exp.narrative !== "string" || exp.narrative.trim() === "") {
    throw new ValidationError("Narrative must be a non-empty string");
  }

  if (typeof exp.finalVerdict !== "string" || exp.finalVerdict.trim() === "") {
    throw new ValidationError("Final verdict must be a non-empty string");
  }

  return exp as unknown as WhiskyExperience;
}

/**
 * Sanitizes a WhiskyExperience object by validating and cleaning all fields
 * @param experience - The experience object to sanitize
 * @returns The sanitized experience object
 */
export function sanitizeWhiskyExperience(experience: unknown): WhiskyExperience {
  const validated = validateWhiskyExperience(experience);

  // Additional sanitization
  return {
    ...validated,
    whiskyDetails: {
      ...validated.whiskyDetails,
      name: sanitizeString(validated.whiskyDetails.name),
      distillery: sanitizeString(validated.whiskyDetails.distillery),
      region: sanitizeString(validated.whiskyDetails.region),
    },
    experienceDate: sanitizeString(validated.experienceDate),
    experienceLocation: sanitizeString(validated.experienceLocation),
    narrative: sanitizeString(validated.narrative),
    finalVerdict: sanitizeString(validated.finalVerdict),
  };
}

/**
 * Validates app settings object
 * @param settings - The settings object to validate
 * @returns The validated settings object
 * @throws ValidationError if validation fails
 */
export function validateAppSettings(settings: unknown): AppSettings {
  if (!settings || typeof settings !== "object") {
    throw new ValidationError("Settings must be an object");
  }

  const s = settings as Record<string, unknown>;

  if (typeof s.apiKey !== "string") {
    throw new ValidationError("API key must be a string");
  }

  if (!["openai", "claude", "gemini"].includes(s.llmProvider as string)) {
    throw new ValidationError("LLM provider must be one of: openai, claude, gemini");
  }

  if (typeof s.temperature !== "number" || s.temperature < 0 || s.temperature > 2) {
    throw new ValidationError("Temperature must be a number between 0 and 2");
  }

  if (typeof s.maxTokens !== "number" || s.maxTokens < 1 || s.maxTokens > 4000) {
    throw new ValidationError("Max tokens must be a number between 1 and 4000");
  }

  return s as unknown as AppSettings;
}

/**
 * Sanitizes a string by trimming whitespace and removing dangerous characters
 * @param str - The string to sanitize
 * @returns The sanitized string
 */
export function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets to prevent XSS
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, ""); // Remove event handlers
}
