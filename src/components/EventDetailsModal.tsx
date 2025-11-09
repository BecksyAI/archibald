/**
 * Event Details Modal component
 * Shows full details of an event in a modal
 */

"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Image as ImageIcon, User } from 'lucide-react';
import { Event } from '@/lib/types';

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
}

export function EventDetailsModal({ isOpen, onClose, event }: EventDetailsModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !event || !mounted) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDocumentedStatus = (status: boolean | 'TBD') => {
    if (status === true) return { text: 'Documented', color: 'text-green-600 dark:text-green-400' };
    if (status === false) return { text: 'Not Documented', color: 'text-red-600 dark:text-red-400' };
    return { text: 'TBD', color: 'text-yellow-600 dark:text-yellow-400' };
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-aged-oak rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl font-semibold text-parchment">Event Details</h2>
            <button
              onClick={onClose}
              className="p-2 text-limestone hover:text-parchment transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-limestone text-sm mb-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(event.date)}
                </div>
                <h3 className="font-serif text-xl font-semibold text-parchment mb-2">
                  Hosted by {event.host}
                </h3>
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded ${
                  getDocumentedStatus(event.documented).color
                } bg-gray-900/50`}
              >
                {getDocumentedStatus(event.documented).text}
              </span>
            </div>

            {/* Description */}
            {event.description && (
              <div>
                <h4 className="font-semibold text-parchment mb-2">Description</h4>
                <p className="text-limestone text-sm">{event.description}</p>
              </div>
            )}

            {/* Images */}
            {event.images && event.images.length > 0 && (
              <div>
                <h4 className="font-semibold text-parchment mb-2 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Images ({event.images.length})
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {event.images.map((image, index) => (
                    <div key={index} className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image}
                        alt={`Event image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t border-gray-700 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-limestone">Created by:</span>
                  <span className="text-parchment ml-2">{event.createdBy}</span>
                </div>
                <div>
                  <span className="text-limestone">Created:</span>
                  <span className="text-parchment ml-2">
                    {new Date(event.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {event.updatedAt && event.updatedAt !== event.createdAt && (
                  <div>
                    <span className="text-limestone">Last updated:</span>
                    <span className="text-parchment ml-2">
                      {new Date(event.updatedAt).toLocaleDateString()}
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

