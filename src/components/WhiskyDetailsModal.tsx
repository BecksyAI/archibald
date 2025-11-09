/**
 * Whisky Details Modal component
 * Shows full details of a whisky entry in a modal
 */

"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Calendar, Wine } from 'lucide-react';
import { WhiskyEntry } from '@/lib/types';

interface WhiskyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  whisky: WhiskyEntry | null;
}

export function WhiskyDetailsModal({ isOpen, onClose, whisky }: WhiskyDetailsModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !whisky || !mounted) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Parse tasting notes - could be string or array
  const getTastingNotes = () => {
    if (!whisky.aromaNotes && !whisky.tasteNotes && !whisky.finishNotes) return [];
    const notes: string[] = [];
    if (whisky.aromaNotes) notes.push(...whisky.aromaNotes.split(',').map(n => n.trim()).filter(Boolean));
    if (whisky.tasteNotes) notes.push(...whisky.tasteNotes.split(',').map(n => n.trim()).filter(Boolean));
    if (whisky.finishNotes) notes.push(...whisky.finishNotes.split(',').map(n => n.trim()).filter(Boolean));
    return notes;
  };

  const tastingNotes = getTastingNotes();

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-aged-oak rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl font-semibold text-parchment">Whisky Details</h2>
            <button
              onClick={onClose}
              className="p-2 text-limestone hover:text-parchment transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Images */}
            {whisky.images && whisky.images.length > 0 && (
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={whisky.images[0]}
                  alt={whisky.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Name and Basic Info */}
            <div>
              <h3 className="font-serif text-2xl font-semibold text-parchment mb-4">{whisky.name}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-limestone" />
                  <span className="text-limestone">Country:</span>
                  <span className="text-parchment">{whisky.countryOfOrigin}</span>
                </div>
                {whisky.age && (
                  <div className="flex items-center gap-2">
                    <Wine className="h-4 w-4 text-limestone" />
                    <span className="text-limestone">Age:</span>
                    <span className="text-parchment">
                      {typeof whisky.age === 'number' ? `${whisky.age} years` : whisky.age}
                    </span>
                  </div>
                )}
                {whisky.abv && (
                  <div className="flex items-center gap-2">
                    <Wine className="h-4 w-4 text-limestone" />
                    <span className="text-limestone">ABV:</span>
                    <span className="text-parchment text-amber-dram">{whisky.abv}%</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-limestone" />
                  <span className="text-limestone">Date:</span>
                  <span className="text-parchment">{formatDate(whisky.eventDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wine className="h-4 w-4 text-limestone" />
                  <span className="text-limestone">Host:</span>
                  <span className="text-parchment">{whisky.host}</span>
                </div>
              </div>
            </div>

            {/* Description / One-line */}
            {whisky.description && (
              <div>
                <p className="text-parchment italic text-lg">{whisky.description}</p>
              </div>
            )}

            {/* Tasting Notes */}
            {tastingNotes.length > 0 && (
              <div>
                <h4 className="font-semibold text-parchment mb-3">Tasting Notes:</h4>
                <div className="flex flex-wrap gap-2">
                  {tastingNotes.map((note, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-amber-dram/20 text-amber-dram rounded-full text-sm border border-amber-dram/30"
                    >
                      {note}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Notes */}
            {(whisky.aromaNotes || whisky.tasteNotes || whisky.finishNotes) && (
              <div className="space-y-3">
                {whisky.aromaNotes && (
                  <div>
                    <h4 className="font-semibold text-parchment mb-1">Aroma:</h4>
                    <p className="text-limestone text-sm">{whisky.aromaNotes}</p>
                  </div>
                )}
                {whisky.tasteNotes && (
                  <div>
                    <h4 className="font-semibold text-parchment mb-1">Taste:</h4>
                    <p className="text-limestone text-sm">{whisky.tasteNotes}</p>
                  </div>
                )}
                {whisky.finishNotes && (
                  <div>
                    <h4 className="font-semibold text-parchment mb-1">Finish:</h4>
                    <p className="text-limestone text-sm">{whisky.finishNotes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Metadata */}
            <div className="border-t border-gray-700 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-limestone">Created by:</span>
                  <span className="text-parchment ml-2">{whisky.createdBy}</span>
                </div>
                <div>
                  <span className="text-limestone">Created:</span>
                  <span className="text-parchment ml-2">
                    {new Date(whisky.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {whisky.updatedAt && whisky.updatedAt !== whisky.createdAt && (
                  <div>
                    <span className="text-limestone">Last updated:</span>
                    <span className="text-parchment ml-2">
                      {new Date(whisky.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}

