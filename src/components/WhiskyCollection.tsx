/**
 * Whisky Collection viewer component
 * Part of Archibald's Athenaeum - M3: Sidebar & Static Components
 */

"use client";

import React, { useState, useMemo } from "react";
import { Search, Filter, MapPin, Calendar, Wine, Percent } from "lucide-react";
import { useWhiskyMemory } from "@/hooks/useWhiskyMemory";
import { WhiskyExperience } from "@/lib/types";

interface WhiskyCollectionProps {
  className?: string;
}

/**
 * Component for viewing and searching the complete whisky collection
 * @param props - Component props
 * @returns WhiskyCollection component
 */
export function WhiskyCollection({ className }: WhiskyCollectionProps) {
  const {
    allExperiences,
    searchExperiences,
    getUniqueRegions,
    getUniqueDistilleries,
    getMemoryStats,
    isUserExperience,
    error,
  } = useWhiskyMemory();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterRegion, setFilterRegion] = useState<string>("");
  const [filterDistillery, setFilterDistillery] = useState<string>("");
  const [filterMinAge, setFilterMinAge] = useState<number | "">("");
  const [filterMaxAge, setFilterMaxAge] = useState<number | "">("");
  const [filterUserAdded, setFilterUserAdded] = useState<boolean | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);

  const uniqueRegions = useMemo(() => getUniqueRegions(), [getUniqueRegions]);
  const uniqueDistilleries = useMemo(() => getUniqueDistilleries(), [getUniqueDistilleries]);
  const memoryStats = useMemo(() => getMemoryStats(), [getMemoryStats]);

  const filteredExperiences = useMemo(() => {
    return searchExperiences(searchQuery, {
      region: filterRegion || undefined,
      distillery: filterDistillery || undefined,
      minAge: filterMinAge !== "" ? filterMinAge : undefined,
      maxAge: filterMaxAge !== "" ? filterMaxAge : undefined,
      isUserAdded: filterUserAdded,
    });
  }, [searchQuery, filterRegion, filterDistillery, filterMinAge, filterMaxAge, filterUserAdded, searchExperiences]);

  const clearFilters = () => {
    setSearchQuery("");
    setFilterRegion("");
    setFilterDistillery("");
    setFilterMinAge("");
    setFilterMaxAge("");
    setFilterUserAdded(undefined);
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
      filterRegion ||
      filterDistillery ||
      filterMinAge !== "" ||
      filterMaxAge !== "" ||
      filterUserAdded !== undefined
  );

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="bg-red-900/20 border border-red-400/50 rounded-lg p-4">
          <p className="text-red-400">Error loading whisky collection: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 lg:p-10 ${className}`}>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-parchment mb-2">Whisky Collection</h1>
        <p className="text-limestone">
          A curated collection of {memoryStats.totalCount} whisky experiences from around the world.
        </p>
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-limestone">
          <span>Core Memory: {memoryStats.coreCount}</span>
          <span>Memory Annex: {memoryStats.userCount}</span>
          <span>Regions: {uniqueRegions.length}</span>
          <span>Distilleries: {uniqueDistilleries.length}</span>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-limestone" />
            <input
              type="text"
              placeholder="Search whiskies, distilleries, regions, or tasting notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-parchment focus:ring-1 focus:ring-amber-dram focus:border-amber-dram transition"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
              ${
                showFilters || hasActiveFilters
                  ? "bg-amber-dram text-parchment"
                  : "bg-gray-700 text-limestone hover:bg-gray-600"
              }
            `}
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="bg-parchment text-amber-dram text-xs px-2 py-1 rounded-full">Active</span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-aged-oak border border-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-limestone block mb-1">Region</label>
                <select
                  value={filterRegion}
                  onChange={(e) => setFilterRegion(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-parchment focus:ring-1 focus:ring-amber-dram focus:border-amber-dram transition"
                >
                  <option value="">All Regions</option>
                  {uniqueRegions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-limestone block mb-1">Distillery</label>
                <select
                  value={filterDistillery}
                  onChange={(e) => setFilterDistillery(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-parchment focus:ring-1 focus:ring-amber-dram focus:border-amber-dram transition"
                >
                  <option value="">All Distilleries</option>
                  {uniqueDistilleries.map((distillery) => (
                    <option key={distillery} value={distillery}>
                      {distillery}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-limestone block mb-1">Source</label>
                <select
                  value={filterUserAdded === undefined ? "" : filterUserAdded.toString()}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFilterUserAdded(value === "" ? undefined : value === "true");
                  }}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-parchment focus:ring-1 focus:ring-amber-dram focus:border-amber-dram transition"
                >
                  <option value="">All Sources</option>
                  <option value="false">Core Memory</option>
                  <option value="true">Memory Annex</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-limestone block mb-1">Min Age</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Min age"
                  value={filterMinAge}
                  onChange={(e) => setFilterMinAge(e.target.value ? parseInt(e.target.value) : "")}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-parchment focus:ring-1 focus:ring-amber-dram focus:border-amber-dram transition"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-limestone block mb-1">Max Age</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Max age"
                  value={filterMaxAge}
                  onChange={(e) => setFilterMaxAge(e.target.value ? parseInt(e.target.value) : "")}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-parchment focus:ring-1 focus:ring-amber-dram focus:border-amber-dram transition"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-700 text-limestone rounded-lg hover:bg-gray-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="mb-4">
        <p className="text-limestone">
          Showing {filteredExperiences.length} of {allExperiences.length} experiences
        </p>
      </div>

      {/* Whisky Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredExperiences.map((experience) => (
          <WhiskyCard key={experience.id} experience={experience} isFromAnnex={isUserExperience(experience.id)} />
        ))}
      </div>

      {filteredExperiences.length === 0 && (
        <div className="text-center py-12">
          <Wine className="h-12 w-12 text-limestone mx-auto mb-4" />
          <p className="text-limestone text-lg">No whiskies found matching your criteria.</p>
          <p className="text-limestone/70 text-sm mt-2">Try adjusting your search terms or filters.</p>
        </div>
      )}
    </div>
  );
}

interface WhiskyCardProps {
  experience: WhiskyExperience;
  isFromAnnex: boolean;
}

/**
 * Individual whisky card component
 * @param props - Component props
 * @returns WhiskyCard component
 */
function WhiskyCard({ experience, isFromAnnex }: WhiskyCardProps) {
  return (
    <div className="bg-aged-oak border border-gray-700 rounded-lg p-6 hover:border-amber-dram/50 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-serif text-xl font-semibold text-parchment mb-1">{experience.whiskyDetails.name}</h3>
          <p className="text-limestone text-sm">{experience.whiskyDetails.distillery}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-limestone">
            {typeof experience.whiskyDetails.age === "number"
              ? `${experience.whiskyDetails.age} years`
              : experience.whiskyDetails.age}
          </div>
          <div className="text-xs text-limestone/70">{experience.whiskyDetails.abv}% ABV</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-limestone" />
          <span className="text-sm text-limestone">{experience.whiskyDetails.region}</span>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-limestone" />
          <span className="text-sm text-limestone">{experience.experienceDate}</span>
        </div>

        <div className="flex items-center gap-2">
          <Percent className="h-4 w-4 text-limestone" />
          <span className="text-sm text-limestone">{experience.whiskyDetails.caskType}</span>
        </div>

        <div>
          <p className="text-sm text-limestone mb-2">Tasting Notes:</p>
          <div className="flex flex-wrap gap-2">
            {experience.whiskyDetails.tastingNotes.map((note, index) => (
              <span key={index} className="px-2 py-1 bg-gray-700 text-limestone text-xs rounded-full">
                {note}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-gray-700">
          <p className="text-sm text-limestone italic">&ldquo;{experience.finalVerdict}&rdquo;</p>
        </div>

        <div className="flex justify-between items-center pt-2">
          <div className="text-xs text-limestone/70">{experience.experienceLocation}</div>
          <div className="text-xs">
            {isFromAnnex ? (
              <span className="text-amber-dram">Memory Annex</span>
            ) : (
              <span className="text-limestone/70">Core Memory</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
