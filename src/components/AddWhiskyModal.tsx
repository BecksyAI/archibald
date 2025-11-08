/**
 * Add Whisky Modal component
 */

"use client";

import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Event } from "@/lib/types";

interface AddWhiskyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddWhiskyModal({ isOpen, onClose, onSuccess }: AddWhiskyModalProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    countryOfOrigin: "",
    age: "",
    description: "",
    aromaNotes: "",
    tasteNotes: "",
    finishNotes: "",
    eventId: "",
    eventDate: "",
    host: "",
    isSolo: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
    }
  }, [isOpen]);

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events");
      const data = await response.json();
      if (response.ok) {
        setEvents(data.events || []);
      }
    } catch {
      // Error fetching events
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Please log in to add whiskies");
      return;
    }

    if (!formData.name || !formData.host || !formData.countryOfOrigin) {
      setError("Name, host, and country of origin are required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("archibald_token");

      // If not solo, create or use event
      let eventId = formData.eventId || undefined;

      if (!formData.isSolo && !eventId) {
        // Create event if needed
        const eventResponse = await fetch("/api/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            date: formData.eventDate,
            host: formData.host.trim(),
            documented: true,
          }),
        });

        const eventData = await eventResponse.json();
        if (eventResponse.ok) {
          eventId = eventData.event.id;
        } else {
          throw new Error(eventData.error || "Failed to create event");
        }
      }

      const whiskyData: Record<string, unknown> = {
        name: formData.name.trim(),
        countryOfOrigin: formData.countryOfOrigin.trim(),
        eventDate: formData.eventDate,
        host: formData.host.trim(),
        images: [],
      };

      if (eventId) whiskyData.eventId = eventId;
      if (formData.age) {
        const ageNum = parseInt(formData.age);
        whiskyData.age = isNaN(ageNum) ? formData.age : ageNum;
      }
      if (formData.description) whiskyData.description = formData.description.trim();
      if (formData.aromaNotes) whiskyData.aromaNotes = formData.aromaNotes.trim();
      if (formData.tasteNotes) whiskyData.tasteNotes = formData.tasteNotes.trim();
      if (formData.finishNotes) whiskyData.finishNotes = formData.finishNotes.trim();

      const response = await fetch("/api/whisky", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(whiskyData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create whisky entry");
      }

      // Reset form
      setFormData({
        name: "",
        countryOfOrigin: "",
        age: "",
        description: "",
        aromaNotes: "",
        tasteNotes: "",
        finishNotes: "",
        eventId: "",
        eventDate: "",
        host: "",
        isSolo: true,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create whisky entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-aged-oak rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-2xl font-semibold text-gray-900 dark:text-parchment">Add Whisky</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 dark:text-limestone hover:text-gray-700 dark:hover:text-parchment transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-400/50 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isSolo}
                onChange={(e) => {
                  const isSolo = e.target.checked;
                  setFormData({
                    ...formData,
                    isSolo,
                    eventId: isSolo ? "" : formData.eventId,
                  });
                }}
                className="w-4 h-4 text-amber-dram rounded focus:ring-amber-dram"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-limestone">
                Solo Entry (not attached to an event)
              </span>
            </label>
          </div>

          {!formData.isSolo && (
            <div>
              <label htmlFor="eventId" className="block text-sm font-medium text-gray-700 dark:text-limestone mb-1">
                Attach to Existing Event
              </label>
              <select
                id="eventId"
                value={formData.eventId}
                onChange={(e) => {
                  const eventId = e.target.value;
                  const selectedEvent = events.find((e) => e.id === eventId);
                  setFormData({
                    ...formData,
                    eventId,
                    eventDate: selectedEvent
                      ? new Date(selectedEvent.date).toISOString().split("T")[0]
                      : formData.eventDate,
                    host: selectedEvent ? selectedEvent.host : formData.host,
                  });
                }}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-parchment focus:ring-2 focus:ring-amber-dram focus:border-amber-dram"
              >
                <option value="">Select an event...</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {new Date(event.date).toLocaleDateString()} - {event.host}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-limestone mb-1">
                Whisky Name *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Lagavulin 16"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-parchment focus:ring-2 focus:ring-amber-dram focus:border-amber-dram"
              />
            </div>

            <div>
              <label
                htmlFor="countryOfOrigin"
                className="block text-sm font-medium text-gray-700 dark:text-limestone mb-1"
              >
                Country of Origin *
              </label>
              <input
                id="countryOfOrigin"
                type="text"
                value={formData.countryOfOrigin}
                onChange={(e) => setFormData({ ...formData, countryOfOrigin: e.target.value })}
                required
                placeholder="e.g., Scotland"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-parchment focus:ring-2 focus:ring-amber-dram focus:border-amber-dram"
              />
            </div>

            <div>
              <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 dark:text-limestone mb-1">
                Date *
              </label>
              <input
                id="eventDate"
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                required
                disabled={!formData.isSolo && !!formData.eventId}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-parchment focus:ring-2 focus:ring-amber-dram focus:border-amber-dram disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="host" className="block text-sm font-medium text-gray-700 dark:text-limestone mb-1">
                Host *
              </label>
              <input
                id="host"
                type="text"
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                required
                disabled={!formData.isSolo && !!formData.eventId}
                placeholder="Joe"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-parchment focus:ring-2 focus:ring-amber-dram focus:border-amber-dram disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-limestone mb-1">
                Age
              </label>
              <input
                id="age"
                type="text"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="e.g., 16 or NAS"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-parchment focus:ring-2 focus:ring-amber-dram focus:border-amber-dram"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-limestone mb-1">
              Description
            </label>
            <textarea
              id="description"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description..."
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-parchment focus:ring-2 focus:ring-amber-dram focus:border-amber-dram"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="aromaNotes" className="block text-sm font-medium text-gray-700 dark:text-limestone mb-1">
                Aroma Notes
              </label>
              <textarea
                id="aromaNotes"
                rows={2}
                value={formData.aromaNotes}
                onChange={(e) => setFormData({ ...formData, aromaNotes: e.target.value })}
                placeholder="Aroma notes..."
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-parchment focus:ring-2 focus:ring-amber-dram focus:border-amber-dram"
              />
            </div>

            <div>
              <label htmlFor="tasteNotes" className="block text-sm font-medium text-gray-700 dark:text-limestone mb-1">
                Taste Notes
              </label>
              <textarea
                id="tasteNotes"
                rows={2}
                value={formData.tasteNotes}
                onChange={(e) => setFormData({ ...formData, tasteNotes: e.target.value })}
                placeholder="Taste notes..."
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-parchment focus:ring-2 focus:ring-amber-dram focus:border-amber-dram"
              />
            </div>

            <div>
              <label htmlFor="finishNotes" className="block text-sm font-medium text-gray-700 dark:text-limestone mb-1">
                Finish Notes
              </label>
              <textarea
                id="finishNotes"
                rows={2}
                value={formData.finishNotes}
                onChange={(e) => setFormData({ ...formData, finishNotes: e.target.value })}
                placeholder="Finish notes..."
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-parchment focus:ring-2 focus:ring-amber-dram focus:border-amber-dram"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-limestone rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-amber-dram text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Add Whisky
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
