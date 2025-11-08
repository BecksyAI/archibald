/**
 * Add Event Modal component
 */

"use client";

import React, { useState } from "react";
import { X, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddEventModal({ isOpen, onClose, onSuccess }: AddEventModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    date: "",
    host: "",
    documented: "TBD" as boolean | "TBD",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Please log in to add events");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("archibald_token");
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: formData.date,
          host: formData.host.trim(),
          documented: formData.documented,
          description: formData.description.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create event");
      }

      // Reset form
      setFormData({
        date: "",
        host: "",
        documented: "TBD",
        description: "",
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-aged-oak rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-2xl font-semibold text-gray-900 dark:text-parchment">Add Event</h2>
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
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-limestone mb-1">
              Date *
            </label>
            <input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-parchment focus:ring-2 focus:ring-amber-dram focus:border-amber-dram"
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
              placeholder="Joe"
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-parchment focus:ring-2 focus:ring-amber-dram focus:border-amber-dram"
            />
          </div>

          <div>
            <label htmlFor="documented" className="block text-sm font-medium text-gray-700 dark:text-limestone mb-1">
              Documented Status
            </label>
            <select
              id="documented"
              value={formData.documented === true ? "true" : formData.documented === false ? "false" : "TBD"}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({
                  ...formData,
                  documented: value === "true" ? true : value === "false" ? false : "TBD",
                });
              }}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-parchment focus:ring-2 focus:ring-amber-dram focus:border-amber-dram"
            >
              <option value="TBD">TBD</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-limestone mb-1">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description..."
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-parchment focus:ring-2 focus:ring-amber-dram focus:border-amber-dram"
            />
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
                  Create Event
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
