/**
 * Events page component
 * Displays all whisky tasting events
 */

"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Image as ImageIcon, Plus, LogIn } from 'lucide-react';
import { Event } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { AddEventModal } from './AddEventModal';
import { EventDetailsModal } from './EventDetailsModal';
import { LoginModal } from './LoginModal';
import { RegisterModal } from './RegisterModal';

export function EventsPage({ className }: { className?: string }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/events');
      const data = await response.json();

      if (response.ok) {
        setEvents(data.events || []);
      } else {
        setError(data.error || 'Failed to load events');
      }
    } catch {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDocumentedStatus = (status: boolean | 'TBD') => {
    if (status === true) return { text: 'Documented', color: 'text-green-600 dark:text-green-400' };
    if (status === false) return { text: 'Not Documented', color: 'text-red-600 dark:text-red-400' };
    return { text: 'TBD', color: 'text-yellow-600 dark:text-yellow-400' };
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-dram mx-auto mb-4"></div>
          <p className="text-limestone">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-aged-oak dark:bg-aged-oak bg-light-surface border-b border-gray-700 dark:border-gray-700 border-light-border md:pl-6 pl-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-parchment">Whisky Events</h1>
            <p className="text-limestone text-sm mt-1">
              {events.length} {events.length === 1 ? 'event' : 'events'} recorded
            </p>
          </div>
          {user ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-base bg-amber-dram text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors"
            >
              <Plus className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Add Event</span>
              <span className="sm:hidden">Add</span>
            </button>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-amber-dram hover:text-amber-400 border border-amber-dram/50 rounded-lg hover:bg-amber-dram/10 transition-colors"
            >
              <LogIn className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Login to add event</span>
              <span className="sm:hidden">Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-400/50 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-limestone/50 mx-auto mb-4" />
            <h2 className="font-serif text-xl font-semibold text-parchment mb-2">No Events Yet</h2>
            <p className="text-limestone mb-6">
              {user
                ? 'Create your first whisky tasting event to get started.'
                : 'Login to create your first whisky tasting event.'}
            </p>
            {user && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-amber-dram text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors"
              >
                Add Event
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-aged-oak dark:bg-aged-oak bg-light-surface border border-gray-700 dark:border-gray-700 border-light-border rounded-lg p-6 hover:border-amber-dram/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 text-limestone text-sm mb-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(event.date)}
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-parchment dark:text-parchment text-light-text mb-2">
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

                {event.description && (
                  <p className="text-limestone dark:text-limestone text-light-text-secondary text-sm mb-4 line-clamp-2">{event.description}</p>
                )}

                {event.images && event.images.length > 0 && (
                  <div className="flex items-center gap-2 text-limestone dark:text-limestone text-light-text-secondary text-sm mb-4">
                    <ImageIcon className="h-4 w-4" />
                    <span>{event.images.length} {event.images.length === 1 ? 'image' : 'images'}</span>
                  </div>
                )}

                <button
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowDetailsModal(true);
                  }}
                  className="w-full mt-4 px-4 py-2 border border-gray-700 dark:border-gray-700 border-light-border text-parchment dark:text-parchment text-light-text rounded-lg hover:bg-gray-700/50 dark:hover:bg-gray-700/50 transition-colors text-sm"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddEventModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          fetchEvents();
          setShowAddModal(false);
        }}
      />

      <EventDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
      />

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
      />

      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onSwitchToLogin={() => {
          setShowRegister(false);
          setShowLogin(true);
        }}
      />
    </div>
  );
}

