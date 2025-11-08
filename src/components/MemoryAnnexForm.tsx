/**
 * Memory Annex form component for adding new whisky entries
 * Updated to use database structure and support event attachment
 */

"use client";

import React, { useState, useEffect } from "react";
import { Save, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Event } from "@/lib/types";

interface MemoryAnnexFormProps {
  className?: string;
}

interface FormData {
  name: string;
  countryOfOrigin: string;
  age: string | number;
  description: string;
  aromaNotes: string;
  tasteNotes: string;
  finishNotes: string;
  eventId: string | null;
  eventDate: string;
  host: string;
  isSolo: boolean;
}

const defaultFormData: FormData = {
  name: "",
  countryOfOrigin: "",
  age: "",
  description: "",
  aromaNotes: "",
  tasteNotes: "",
  finishNotes: "",
  eventId: null,
  eventDate: "",
  host: "",
  isSolo: true,
};

/**
 * Component for adding new whisky entries to the Memory Annex
 */
export function MemoryAnnexForm({ className }: MemoryAnnexFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const response = await fetch("/api/events");
      const data = await response.json();
      if (response.ok) {
        setEvents(data.events || []);
      }
    } catch {
      // Error fetching events
    } finally {
      setLoadingEvents(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // If attaching to event, populate event date and host
      if (field === "eventId" && value) {
        const selectedEvent = events.find((e) => e.id === value);
        if (selectedEvent) {
          updated.eventDate = new Date(selectedEvent.date).toISOString().split("T")[0];
          updated.host = selectedEvent.host;
          updated.isSolo = false;
        }
      } else if (field === "isSolo" && value === true) {
        updated.eventId = null;
        updated.eventDate = "";
        updated.host = "";
      }

      return updated;
    });

    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Whisky name is required";
    }

    if (!formData.countryOfOrigin.trim()) {
      newErrors.countryOfOrigin = "Country of origin is required";
    }

    if (!formData.isSolo) {
      if (!formData.eventId) {
        newErrors.eventId = "Please select an event or mark as solo";
      }
      if (!formData.host.trim()) {
        newErrors.host = "Host is required when attached to event";
      }
    } else {
      if (!formData.eventDate) {
        newErrors.eventDate = "Date is required for solo entries";
      }
      if (!formData.host.trim()) {
        newErrors.host = "Host is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setErrors({ name: "Please log in to add entries" });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("archibald_token");

      // If not solo, we need to create or use the event
      let eventId = formData.eventId;

      if (!formData.isSolo && !eventId) {
        // Create a new event if one doesn't exist
        const eventResponse = await fetch("/api/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            date: formData.eventDate,
            host: formData.host,
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

      // Create whisky entry
      const whiskyData: Record<string, unknown> = {
        name: formData.name.trim(),
        countryOfOrigin: formData.countryOfOrigin.trim(),
        age: formData.age
          ? typeof formData.age === "string"
            ? parseInt(formData.age) || formData.age
            : formData.age
          : undefined,
        description: formData.description?.trim() || undefined,
        aromaNotes: formData.aromaNotes?.trim() || undefined,
        tasteNotes: formData.tasteNotes?.trim() || undefined,
        finishNotes: formData.finishNotes?.trim() || undefined,
        eventDate: formData.eventDate,
        host: formData.host.trim(),
        images: [],
      };

      if (eventId) {
        whiskyData.eventId = eventId;
      }

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
        throw new Error(data.error || "Failed to add whisky entry");
      }

      // Reset form
      setFormData(defaultFormData);
      setErrors({});
      setShowSuccessMessage(true);

      // Refresh events list
      fetchEvents();

      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      setErrors({ name: error instanceof Error ? error.message : "Failed to add entry. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearForm = () => {
    setFormData(defaultFormData);
    setErrors({});
  };

  if (!user) {
    return (
      <div className={`flex flex-col h-full items-center justify-center p-6 ${className}`}>
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-limestone mx-auto mb-4" />
          <h2 className="font-serif text-xl font-semibold text-parchment mb-2">Login Required</h2>
          <p className="text-limestone">Please log in to add whisky entries to the Memory Annex.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-shrink-0 p-6 lg:p-8 border-b border-gray-700 dark:border-gray-700 border-light-border">
        <h1 className="font-serif text-3xl font-semibold text-parchment dark:text-parchment text-light-text mb-2">
          Memory Annex
        </h1>
        <p className="text-limestone dark:text-limestone text-light-text-secondary mb-4">
          Add your personal whisky experiences to my collection. I shall judge them accordingly.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">
          {showSuccessMessage && (
            <div className="mb-6 p-4 bg-green-900/20 dark:bg-green-900/20 border border-green-400/50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <p className="text-green-400">Whisky entry added successfully to the Memory Annex!</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Selection Section */}
            <div className="bg-aged-oak dark:bg-aged-oak bg-light-surface border border-gray-700 dark:border-gray-700 border-light-border rounded-lg p-6">
              <h2 className="font-serif text-xl font-semibold text-parchment dark:text-parchment text-light-text mb-4">
                Event Selection
              </h2>

              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isSolo}
                    onChange={(e) => updateFormData("isSolo", e.target.checked)}
                    className="w-4 h-4 text-amber-dram rounded focus:ring-amber-dram"
                  />
                  <span className="text-sm font-medium text-limestone dark:text-limestone text-light-text-secondary">
                    Solo Entry (not attached to an event)
                  </span>
                </label>
              </div>

              {!formData.isSolo && (
                <div>
                  <label
                    htmlFor="eventId"
                    className="block text-sm font-medium text-limestone dark:text-limestone text-light-text-secondary mb-1"
                  >
                    Attach to Existing Event
                  </label>
                  {loadingEvents ? (
                    <div className="text-sm text-limestone">Loading events...</div>
                  ) : (
                    <select
                      id="eventId"
                      value={formData.eventId || ""}
                      onChange={(e) => updateFormData("eventId", e.target.value || null)}
                      className={`w-full bg-gray-900 dark:bg-gray-900 bg-white border rounded-md p-2 text-parchment dark:text-parchment text-light-text focus:ring-1 focus:ring-amber-dram transition ${
                        errors.eventId
                          ? "border-red-400"
                          : "border-gray-700 dark:border-gray-700 border-light-border focus:border-amber-dram"
                      }`}
                    >
                      <option value="">Select an event...</option>
                      {events.map((event) => (
                        <option key={event.id} value={event.id}>
                          {new Date(event.date).toLocaleDateString()} - {event.host}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.eventId && <p className="text-red-400 text-xs mt-1">{errors.eventId}</p>}
                </div>
              )}

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="eventDate"
                    className="block text-sm font-medium text-limestone dark:text-limestone text-light-text-secondary mb-1"
                  >
                    Date *
                  </label>
                  <input
                    id="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => updateFormData("eventDate", e.target.value)}
                    disabled={!formData.isSolo && !!formData.eventId}
                    className={`w-full bg-gray-900 dark:bg-gray-900 bg-white border rounded-md p-2 text-parchment dark:text-parchment text-light-text focus:ring-1 focus:ring-amber-dram transition disabled:opacity-50 ${
                      errors.eventDate
                        ? "border-red-400"
                        : "border-gray-700 dark:border-gray-700 border-light-border focus:border-amber-dram"
                    }`}
                  />
                  {errors.eventDate && <p className="text-red-400 text-xs mt-1">{errors.eventDate}</p>}
                </div>

                <div>
                  <label
                    htmlFor="host"
                    className="block text-sm font-medium text-limestone dark:text-limestone text-light-text-secondary mb-1"
                  >
                    Host *
                  </label>
                  <input
                    id="host"
                    type="text"
                    value={formData.host}
                    onChange={(e) => updateFormData("host", e.target.value)}
                    disabled={!formData.isSolo && !!formData.eventId}
                    className={`w-full bg-gray-900 dark:bg-gray-900 bg-white border rounded-md p-2 text-parchment dark:text-parchment text-light-text focus:ring-1 focus:ring-amber-dram transition disabled:opacity-50 ${
                      errors.host
                        ? "border-red-400"
                        : "border-gray-700 dark:border-gray-700 border-light-border focus:border-amber-dram"
                    }`}
                    placeholder="Joe"
                  />
                  {errors.host && <p className="text-red-400 text-xs mt-1">{errors.host}</p>}
                </div>
              </div>
            </div>

            {/* Whisky Details Section */}
            <div className="bg-aged-oak dark:bg-aged-oak bg-light-surface border border-gray-700 dark:border-gray-700 border-light-border rounded-lg p-6">
              <h2 className="font-serif text-xl font-semibold text-parchment dark:text-parchment text-light-text mb-4">
                Whisky Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-limestone dark:text-limestone text-light-text-secondary mb-1"
                  >
                    Whisky Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                    className={`w-full bg-gray-900 dark:bg-gray-900 bg-white border rounded-md p-2 text-parchment dark:text-parchment text-light-text focus:ring-1 focus:ring-amber-dram transition ${
                      errors.name
                        ? "border-red-400"
                        : "border-gray-700 dark:border-gray-700 border-light-border focus:border-amber-dram"
                    }`}
                    placeholder="e.g., Lagavulin 16 Year Old"
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label
                    htmlFor="countryOfOrigin"
                    className="block text-sm font-medium text-limestone dark:text-limestone text-light-text-secondary mb-1"
                  >
                    Country of Origin *
                  </label>
                  <input
                    id="countryOfOrigin"
                    type="text"
                    value={formData.countryOfOrigin}
                    onChange={(e) => updateFormData("countryOfOrigin", e.target.value)}
                    className={`w-full bg-gray-900 dark:bg-gray-900 bg-white border rounded-md p-2 text-parchment dark:text-parchment text-light-text focus:ring-1 focus:ring-amber-dram transition ${
                      errors.countryOfOrigin
                        ? "border-red-400"
                        : "border-gray-700 dark:border-gray-700 border-light-border focus:border-amber-dram"
                    }`}
                    placeholder="e.g., Scotland"
                  />
                  {errors.countryOfOrigin && <p className="text-red-400 text-xs mt-1">{errors.countryOfOrigin}</p>}
                </div>

                <div>
                  <label
                    htmlFor="age"
                    className="block text-sm font-medium text-limestone dark:text-limestone text-light-text-secondary mb-1"
                  >
                    Age
                  </label>
                  <input
                    id="age"
                    type="text"
                    value={formData.age}
                    onChange={(e) => updateFormData("age", e.target.value)}
                    className="w-full bg-gray-900 dark:bg-gray-900 bg-white border border-gray-700 dark:border-gray-700 border-light-border rounded-md p-2 text-parchment dark:text-parchment text-light-text focus:ring-1 focus:ring-amber-dram focus:border-amber-dram transition"
                    placeholder="e.g., 16 or NAS"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-limestone dark:text-limestone text-light-text-secondary mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => updateFormData("description", e.target.value)}
                  className="w-full bg-gray-900 dark:bg-gray-900 bg-white border border-gray-700 dark:border-gray-700 border-light-border rounded-md p-2 text-parchment dark:text-parchment text-light-text focus:ring-1 focus:ring-amber-dram focus:border-amber-dram transition"
                  placeholder="Brief description of the whisky..."
                />
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="aromaNotes"
                    className="block text-sm font-medium text-limestone dark:text-limestone text-light-text-secondary mb-1"
                  >
                    Aroma Notes
                  </label>
                  <textarea
                    id="aromaNotes"
                    rows={3}
                    value={formData.aromaNotes}
                    onChange={(e) => updateFormData("aromaNotes", e.target.value)}
                    className="w-full bg-gray-900 dark:bg-gray-900 bg-white border border-gray-700 dark:border-gray-700 border-light-border rounded-md p-2 text-parchment dark:text-parchment text-light-text focus:ring-1 focus:ring-amber-dram focus:border-amber-dram transition"
                    placeholder="Aroma notes..."
                  />
                </div>

                <div>
                  <label
                    htmlFor="tasteNotes"
                    className="block text-sm font-medium text-limestone dark:text-limestone text-light-text-secondary mb-1"
                  >
                    Taste Notes
                  </label>
                  <textarea
                    id="tasteNotes"
                    rows={3}
                    value={formData.tasteNotes}
                    onChange={(e) => updateFormData("tasteNotes", e.target.value)}
                    className="w-full bg-gray-900 dark:bg-gray-900 bg-white border border-gray-700 dark:border-gray-700 border-light-border rounded-md p-2 text-parchment dark:text-parchment text-light-text focus:ring-1 focus:ring-amber-dram focus:border-amber-dram transition"
                    placeholder="Taste notes..."
                  />
                </div>

                <div>
                  <label
                    htmlFor="finishNotes"
                    className="block text-sm font-medium text-limestone dark:text-limestone text-light-text-secondary mb-1"
                  >
                    Finish Notes
                  </label>
                  <textarea
                    id="finishNotes"
                    rows={3}
                    value={formData.finishNotes}
                    onChange={(e) => updateFormData("finishNotes", e.target.value)}
                    className="w-full bg-gray-900 dark:bg-gray-900 bg-white border border-gray-700 dark:border-gray-700 border-light-border rounded-md p-2 text-parchment dark:text-parchment text-light-text focus:ring-1 focus:ring-amber-dram focus:border-amber-dram transition"
                    placeholder="Finish notes..."
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-amber-dram text-parchment font-semibold py-3 rounded-lg hover:bg-amber-500 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-parchment mr-2"></div>
                    Adding Entry...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Add to Memory Annex
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={clearForm}
                className="px-6 py-3 bg-gray-700 dark:bg-gray-700 bg-gray-200 text-parchment dark:text-parchment text-light-text rounded-lg hover:bg-gray-600 dark:hover:bg-gray-600 transition-colors"
              >
                Clear Form
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
