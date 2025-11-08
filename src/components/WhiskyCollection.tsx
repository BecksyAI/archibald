/**
 * Whisky Collection viewer component
 * Updated to use database structure
 */

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, Filter, MapPin, Calendar, Wine, Plus, Image as ImageIcon } from "lucide-react";
import { WhiskyEntry } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { AddWhiskyModal } from "./AddWhiskyModal";

interface WhiskyCollectionProps {
  className?: string;
}

/**
 * Component for viewing and searching the complete whisky collection
 */
export function WhiskyCollection({ className }: WhiskyCollectionProps) {
  const [whiskies, setWhiskies] = useState<WhiskyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCountry, setFilterCountry] = useState<string>("");
  const [filterHost, setFilterHost] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchWhiskies();
    // Auto-add image to Glenfiddich 12 entry if it exists
    const addImageToGlenfiddich = async () => {
      try {
        await fetch('/api/whisky/update-glenfiddich', { method: 'POST' });
      } catch {
        // Silently fail - not critical
      }
    };
    addImageToGlenfiddich();
  }, []);

  const fetchWhiskies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/whisky');
      const data = await response.json();

      if (response.ok) {
        setWhiskies(data.whiskies || []);
      } else {
        setError(data.error || 'Failed to load whiskies');
      }
    } catch {
      setError('Failed to load whiskies');
    } finally {
      setLoading(false);
    }
  };

  const uniqueCountries = useMemo(() => {
    const countries = new Set(whiskies.map((w) => w.countryOfOrigin));
    return Array.from(countries).sort();
  }, [whiskies]);

  const uniqueHosts = useMemo(() => {
    const hosts = new Set(whiskies.map((w) => w.host));
    return Array.from(hosts).sort();
  }, [whiskies]);

  const filteredWhiskies = useMemo(() => {
    return whiskies.filter((whisky) => {
      const matchesSearch =
        !searchQuery ||
        whisky.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        whisky.countryOfOrigin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        whisky.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCountry = !filterCountry || whisky.countryOfOrigin === filterCountry;
      const matchesHost = !filterHost || whisky.host === filterHost;

      return matchesSearch && matchesCountry && matchesHost;
    });
  }, [whiskies, searchQuery, filterCountry, filterHost]);

  const clearFilters = () => {
    setSearchQuery("");
    setFilterCountry("");
    setFilterHost("");
  };

  const hasActiveFilters = Boolean(searchQuery || filterCountry || filterHost);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-dram mx-auto mb-4"></div>
          <p className="text-limestone">Loading collection...</p>
        </div>
      </div>
    );
  }

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
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-aged-oak border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-parchment">Whisky Collection</h1>
            <p className="text-limestone text-sm mt-1">
              {whiskies.length} {whiskies.length === 1 ? 'whisky' : 'whiskies'} in the collection
            </p>
          </div>
          {user && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-dram text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Whisky
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex-shrink-0 p-6 border-b border-gray-700 dark:border-gray-700 border-light-border">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-limestone" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search whiskies..."
              className="w-full pl-10 pr-4 py-2 bg-gray-900 dark:bg-gray-900 bg-white border border-gray-700 dark:border-gray-700 border-light-border rounded-lg text-parchment dark:text-parchment text-light-text focus:ring-2 focus:ring-amber-dram focus:border-amber-dram"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  showFilters || hasActiveFilters
                    ? 'bg-amber-dram/10 border-amber-dram text-amber-dram'
                    : 'bg-gray-900 dark:bg-gray-900 bg-white border-gray-700 dark:border-gray-700 border-light-border text-limestone dark:text-limestone text-light-text-secondary hover:border-gray-600 dark:hover:border-gray-600'
                }`}
          >
            <Filter className="h-5 w-5" />
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-900/50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-limestone mb-1">Country</label>
              <select
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-parchment focus:ring-2 focus:ring-amber-dram"
              >
                <option value="">All Countries</option>
                {uniqueCountries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-limestone mb-1">Host</label>
              <select
                value={filterHost}
                onChange={(e) => setFilterHost(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-parchment focus:ring-2 focus:ring-amber-dram"
              >
                <option value="">All Hosts</option>
                {uniqueHosts.map((host) => (
                  <option key={host} value={host}>
                    {host}
                  </option>
                ))}
              </select>
            </div>
            {hasActiveFilters && (
              <div className="md:col-span-2">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-limestone hover:text-parchment transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Whisky Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredWhiskies.length === 0 ? (
          <div className="text-center py-12">
            <Wine className="h-16 w-16 text-limestone/50 mx-auto mb-4" />
            <h2 className="font-serif text-xl font-semibold text-parchment mb-2">No Whiskies Found</h2>
            <p className="text-limestone mb-6">
              {hasActiveFilters ? 'Try adjusting your filters.' : 'No whiskies in the collection yet.'}
            </p>
            {user && !hasActiveFilters && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-amber-dram text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors"
              >
                Add Whisky
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredWhiskies.map((whisky) => (
              <div
                key={whisky.id}
                className="bg-aged-oak dark:bg-aged-oak bg-light-surface border border-gray-700 dark:border-gray-700 border-light-border rounded-lg p-6 hover:border-amber-dram/50 transition-colors"
              >
                {/* Whisky Image */}
                {whisky.images && whisky.images.length > 0 ? (
                  <div className="mb-4 aspect-video bg-gray-900 dark:bg-gray-900 bg-gray-100 rounded-lg overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={whisky.images[0]}
                      alt={whisky.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="mb-4 aspect-video bg-gray-900 dark:bg-gray-900 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-limestone/30" />
                  </div>
                )}

                {/* Whisky Details */}
                <div className="mb-4">
                  <h3 className="font-serif text-xl font-semibold text-parchment mb-2">{whisky.name}</h3>
                  <div className="space-y-1 text-sm text-limestone">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{whisky.countryOfOrigin}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(whisky.eventDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wine className="h-4 w-4" />
                      <span>Host: {whisky.host}</span>
                    </div>
                    {whisky.age && (
                      <div className="text-amber-dram">
                        Age: {whisky.age} {typeof whisky.age === 'number' ? 'years' : ''}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {(whisky.aromaNotes || whisky.tasteNotes || whisky.finishNotes) && (
                  <div className="mb-4 space-y-2 text-sm">
                    {whisky.aromaNotes && (
                      <div>
                        <span className="font-medium text-limestone">Aroma: </span>
                        <span className="text-parchment">{whisky.aromaNotes}</span>
                      </div>
                    )}
                    {whisky.tasteNotes && (
                      <div>
                        <span className="font-medium text-limestone">Taste: </span>
                        <span className="text-parchment">{whisky.tasteNotes}</span>
                      </div>
                    )}
                    {whisky.finishNotes && (
                      <div>
                        <span className="font-medium text-limestone">Finish: </span>
                        <span className="text-parchment">{whisky.finishNotes}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Description */}
                {whisky.description && (
                  <p className="text-sm text-limestone mb-4 line-clamp-2">{whisky.description}</p>
                )}

                {/* View Details Button */}
                <button
                  onClick={() => {
                    // TODO: Navigate to whisky detail page
                    alert(`Whisky detail for ${whisky.name} coming soon`);
                  }}
                  className="w-full mt-4 px-4 py-2 border border-gray-700 text-parchment rounded-lg hover:bg-gray-700/50 transition-colors text-sm"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddWhiskyModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          fetchWhiskies();
          setShowAddModal(false);
        }}
      />
    </div>
  );
}
