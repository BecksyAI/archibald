/**
 * Whisky memory management hook for Core Memory and Memory Annex integration
 * Part of Archibald's Athenaeum - M2: Core Logic & Hooks
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { WhiskyExperience, MemoryAnnex } from "@/lib/types";
import { sanitizeWhiskyExperience } from "@/lib/validation";

// Import the core memory data
import coreMemoryData from "@/data/whisky_experiences.json";

const DEFAULT_MEMORY_ANNEX: MemoryAnnex = {
  userExperiences: [],
  lastUpdated: new Date(),
};

/**
 * Hook for managing Archibald's whisky memory (Core Memory + Memory Annex)
 * @returns Complete whisky memory management interface
 */
export function useWhiskyMemory() {
  const [memoryAnnex, setMemoryAnnex, annexError] = useLocalStorage<MemoryAnnex>(
    "archibald-memory-annex",
    DEFAULT_MEMORY_ANNEX
  );

  const [coreMemory, setCoreMemory] = useState<WhiskyExperience[]>([]);
  const [coreMemoryError, setCoreMemoryError] = useState<string | null>(null);

  // Load core memory from JSON file
  useEffect(() => {
    try {
      // Validate each experience in core memory
      const validatedCoreMemory = coreMemoryData.map((exp, index) => {
        try {
          return sanitizeWhiskyExperience(exp);
        } catch (error) {
          console.error(`[useWhiskyMemory] Invalid core memory experience at index ${index}:`, error);
          throw error;
        }
      });

      setCoreMemory(validatedCoreMemory);
      setCoreMemoryError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load core memory";
      setCoreMemoryError(message);
      console.error("[useWhiskyMemory] Error loading core memory:", error);
    }
  }, []);

  /**
   * Get all experiences (Core Memory + Memory Annex) merged together
   */
  const allExperiences = useMemo(() => {
    return [...coreMemory, ...memoryAnnex.userExperiences];
  }, [coreMemory, memoryAnnex.userExperiences]);

  /**
   * Get next available ID for new experiences
   */
  const getNextId = useCallback(() => {
    const maxId = Math.max(...allExperiences.map((exp) => exp.id), 0);
    return maxId + 1;
  }, [allExperiences]);

  /**
   * Add a new experience to the Memory Annex
   * @param experience - The experience to add (without ID)
   */
  const addExperience = useCallback(
    (experience: Omit<WhiskyExperience, "id">) => {
      try {
        const newExperience = sanitizeWhiskyExperience({
          ...experience,
          id: getNextId(),
        });

        setMemoryAnnex((prev) => ({
          userExperiences: [...prev.userExperiences, newExperience],
          lastUpdated: new Date(),
        }));

        return newExperience;
      } catch (error) {
        console.error("[useWhiskyMemory] Error adding experience:", error);
        throw error;
      }
    },
    [getNextId, setMemoryAnnex]
  );

  /**
   * Update an existing experience in the Memory Annex
   * @param id - The experience ID to update
   * @param updates - Partial experience updates
   */
  const updateExperience = useCallback(
    (id: number, updates: Partial<Omit<WhiskyExperience, "id">>) => {
      setMemoryAnnex((prev) => ({
        userExperiences: prev.userExperiences.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp)),
        lastUpdated: new Date(),
      }));
    },
    [setMemoryAnnex]
  );

  /**
   * Remove an experience from the Memory Annex
   * @param id - The experience ID to remove
   */
  const removeExperience = useCallback(
    (id: number) => {
      setMemoryAnnex((prev) => ({
        userExperiences: prev.userExperiences.filter((exp) => exp.id !== id),
        lastUpdated: new Date(),
      }));
    },
    [setMemoryAnnex]
  );

  /**
   * Find experiences by search criteria
   * @param query - Search query string
   * @param filters - Optional filters
   */
  const searchExperiences = useCallback(
    (
      query: string,
      filters?: {
        region?: string;
        distillery?: string;
        minAge?: number;
        maxAge?: number;
        isUserAdded?: boolean;
      }
    ) => {
      const normalizedQuery = query.toLowerCase().trim();

      return allExperiences.filter((exp) => {
        // Text search across multiple fields
        const searchableText = [
          exp.whiskyDetails.name,
          exp.whiskyDetails.distillery,
          exp.whiskyDetails.region,
          exp.whiskyDetails.caskType,
          exp.whiskyDetails.tastingNotes.join(" "),
          exp.experienceLocation,
          exp.narrative,
          exp.finalVerdict,
        ]
          .join(" ")
          .toLowerCase();

        const matchesQuery = !query || searchableText.includes(normalizedQuery);

        // Apply filters
        if (filters?.region && exp.whiskyDetails.region !== filters.region) {
          return false;
        }

        if (filters?.distillery && exp.whiskyDetails.distillery !== filters.distillery) {
          return false;
        }

        if (filters?.minAge && typeof exp.whiskyDetails.age === "number" && exp.whiskyDetails.age < filters.minAge) {
          return false;
        }

        if (filters?.maxAge && typeof exp.whiskyDetails.age === "number" && exp.whiskyDetails.age > filters.maxAge) {
          return false;
        }

        if (filters?.isUserAdded !== undefined) {
          const isUserExperience = memoryAnnex.userExperiences.some((userExp) => userExp.id === exp.id);
          if (filters.isUserAdded !== isUserExperience) {
            return false;
          }
        }

        return matchesQuery;
      });
    },
    [allExperiences, memoryAnnex.userExperiences]
  );

  /**
   * Get experience by ID
   * @param id - The experience ID
   */
  const getExperienceById = useCallback(
    (id: number) => {
      return allExperiences.find((exp) => exp.id === id);
    },
    [allExperiences]
  );

  /**
   * Check if an experience is from the Memory Annex (user-added)
   * @param id - The experience ID
   */
  const isUserExperience = useCallback(
    (id: number) => {
      return memoryAnnex.userExperiences.some((exp) => exp.id === id);
    },
    [memoryAnnex.userExperiences]
  );

  /**
   * Get unique regions from all experiences
   */
  const getUniqueRegions = useCallback(() => {
    const regions = allExperiences.map((exp) => exp.whiskyDetails.region);
    return Array.from(new Set(regions)).sort();
  }, [allExperiences]);

  /**
   * Get unique distilleries from all experiences
   */
  const getUniqueDistilleries = useCallback(() => {
    const distilleries = allExperiences.map((exp) => exp.whiskyDetails.distillery);
    return Array.from(new Set(distilleries)).sort();
  }, [allExperiences]);

  /**
   * Get statistics about the memory
   */
  const getMemoryStats = useCallback(() => {
    const totalCount = allExperiences.length;
    const coreCount = coreMemory.length;
    const userCount = memoryAnnex.userExperiences.length;

    const regionStats = allExperiences.reduce((acc, exp) => {
      acc[exp.whiskyDetails.region] = (acc[exp.whiskyDetails.region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageAge =
      allExperiences
        .filter((exp) => typeof exp.whiskyDetails.age === "number")
        .reduce((sum, exp) => sum + (exp.whiskyDetails.age as number), 0) /
      allExperiences.filter((exp) => typeof exp.whiskyDetails.age === "number").length;

    return {
      totalCount,
      coreCount,
      userCount,
      regionStats,
      averageAge: isNaN(averageAge) ? 0 : averageAge,
      lastUpdated: memoryAnnex.lastUpdated,
    };
  }, [allExperiences, coreMemory, memoryAnnex]);

  /**
   * Clear all user experiences from Memory Annex
   */
  const clearMemoryAnnex = useCallback(() => {
    setMemoryAnnex(DEFAULT_MEMORY_ANNEX);
  }, [setMemoryAnnex]);

  /**
   * Export all experiences as JSON
   */
  const exportMemory = useCallback(() => {
    return {
      coreMemory,
      memoryAnnex,
      exportedAt: new Date().toISOString(),
      stats: getMemoryStats(),
    };
  }, [coreMemory, memoryAnnex, getMemoryStats]);

  return {
    // Data
    coreMemory,
    memoryAnnex,
    allExperiences,

    // Operations
    addExperience,
    updateExperience,
    removeExperience,
    clearMemoryAnnex,

    // Queries
    searchExperiences,
    getExperienceById,
    isUserExperience,

    // Metadata
    getUniqueRegions,
    getUniqueDistilleries,
    getMemoryStats,
    getNextId,

    // Utilities
    exportMemory,

    // Error handling
    error: coreMemoryError || annexError,
    coreMemoryError,
    annexError,
  };
}

/**
 * Hook for getting a single experience by ID with loading state
 * @param id - The experience ID
 * @returns Experience data with loading state
 */
export function useWhiskyExperience(id: number) {
  const { getExperienceById, isUserExperience, error } = useWhiskyMemory();

  const experience = useMemo(() => getExperienceById(id), [getExperienceById, id]);
  const isFromAnnex = useMemo(() => isUserExperience(id), [isUserExperience, id]);

  return {
    experience,
    isFromAnnex,
    isLoading: false, // Since we're using synchronous local data
    error,
  };
}
