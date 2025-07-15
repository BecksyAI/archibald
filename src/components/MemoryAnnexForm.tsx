/**
 * Memory Annex form component for adding new whisky experiences
 * Part of Archibald's Athenaeum - M3: Sidebar & Static Components
 */

"use client";

import React, { useState } from "react";
import { Plus, X, Save, AlertCircle, CheckCircle } from "lucide-react";
import { useWhiskyMemory } from "@/hooks/useWhiskyMemory";
import { WhiskyExperience } from "@/lib/types";

interface MemoryAnnexFormProps {
  className?: string;
}

interface FormData {
  name: string;
  distillery: string;
  region: string;
  age: number | "No Age Statement";
  abv: number;
  tastingNotes: string[];
  caskType: string;
  foodPairing: string;
  experienceDate: string;
  experienceLocation: string;
  narrative: string;
  finalVerdict: string;
}

const defaultFormData: FormData = {
  name: "",
  distillery: "",
  region: "",
  age: "No Age Statement",
  abv: 40,
  tastingNotes: [""],
  caskType: "",
  foodPairing: "",
  experienceDate: "",
  experienceLocation: "",
  narrative: "",
  finalVerdict: "",
};

/**
 * Component for adding new whisky experiences to the Memory Annex
 * @param props - Component props
 * @returns MemoryAnnexForm component
 */
export function MemoryAnnexForm({ className }: MemoryAnnexFormProps) {
  const { addExperience, memoryAnnex, getMemoryStats, error } = useWhiskyMemory();
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [newTastingNote, setNewTastingNote] = useState("");

  const memoryStats = getMemoryStats();

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const addTastingNote = () => {
    if (newTastingNote.trim()) {
      updateFormData("tastingNotes", [...formData.tastingNotes, newTastingNote.trim()]);
      setNewTastingNote("");
    }
  };

  const removeTastingNote = (index: number) => {
    updateFormData(
      "tastingNotes",
      formData.tastingNotes.filter((_, i) => i !== index)
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Whisky name is required";
    }

    if (!formData.distillery.trim()) {
      newErrors.distillery = "Distillery is required";
    }

    if (!formData.region.trim()) {
      newErrors.region = "Region is required";
    }

    if (formData.age !== "No Age Statement" && (formData.age < 0 || formData.age > 100)) {
      newErrors.age = "Age must be between 0 and 100";
    }

    if (formData.abv < 0 || formData.abv > 100) {
      newErrors.abv = "ABV must be between 0 and 100";
    }

    const validTastingNotes = formData.tastingNotes.filter((note) => note.trim());
    if (validTastingNotes.length === 0) {
      newErrors.tastingNotes = "At least one tasting note is required";
    }

    if (!formData.caskType.trim()) {
      newErrors.caskType = "Cask type is required";
    }

    if (!formData.foodPairing.trim()) {
      newErrors.foodPairing = "Food pairing is required";
    }

    if (!formData.experienceDate.trim()) {
      newErrors.experienceDate = "Experience date is required";
    }

    if (!formData.experienceLocation.trim()) {
      newErrors.experienceLocation = "Experience location is required";
    }

    if (!formData.narrative.trim()) {
      newErrors.narrative = "Narrative is required";
    }

    if (!formData.finalVerdict.trim()) {
      newErrors.finalVerdict = "Final verdict is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const experienceData: Omit<WhiskyExperience, "id"> = {
        whiskyDetails: {
          name: formData.name.trim(),
          distillery: formData.distillery.trim(),
          region: formData.region.trim(),
          age: formData.age,
          abv: formData.abv,
          tastingNotes: formData.tastingNotes.filter((note) => note.trim()),
          caskType: formData.caskType.trim(),
          foodPairing: formData.foodPairing.trim(),
        },
        experienceDate: formData.experienceDate.trim(),
        experienceLocation: formData.experienceLocation.trim(),
        narrative: formData.narrative.trim(),
        finalVerdict: formData.finalVerdict.trim(),
      };

      await addExperience(experienceData);

      // Reset form
      setFormData(defaultFormData);
      setErrors({});
      setShowSuccessMessage(true);

      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error("Error adding experience:", error);
      setErrors({ name: "Failed to add experience. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearForm = () => {
    setFormData(defaultFormData);
    setErrors({});
  };

  return (
    <div className={`p-6 lg:p-10 ${className}`}>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-parchment mb-2">Memory Annex</h1>
        <p className="text-limestone mb-4">
          Add your personal whisky experiences to my collection. I shall judge them accordingly.
        </p>
        <div className="flex items-center gap-4 text-sm text-limestone">
          <span>Current entries: {memoryStats.userCount}</span>
          <span>Last updated: {memoryStats.lastUpdated.toLocaleDateString()}</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-400/50 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="text-red-400">Error: {error}</p>
          </div>
        </div>
      )}

      {showSuccessMessage && (
        <div className="mb-6 p-4 bg-green-900/20 border border-green-400/50 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <p className="text-green-400">Experience added successfully to the Memory Annex!</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Whisky Details Section */}
        <div className="bg-aged-oak border border-gray-700 rounded-lg p-6">
          <h2 className="font-serif text-xl font-semibold text-parchment mb-4">Whisky Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-limestone mb-1">
                Whisky Name *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                className={`w-full bg-gray-900 border rounded-md p-2 text-parchment focus:ring-1 focus:ring-amber-dram transition ${
                  errors.name ? "border-red-400" : "border-gray-700 focus:border-amber-dram"
                }`}
                placeholder="e.g., Lagavulin 16 Year Old"
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="distillery" className="block text-sm font-medium text-limestone mb-1">
                Distillery *
              </label>
              <input
                id="distillery"
                type="text"
                value={formData.distillery}
                onChange={(e) => updateFormData("distillery", e.target.value)}
                className={`w-full bg-gray-900 border rounded-md p-2 text-parchment focus:ring-1 focus:ring-amber-dram transition ${
                  errors.distillery ? "border-red-400" : "border-gray-700 focus:border-amber-dram"
                }`}
                placeholder="e.g., Lagavulin"
              />
              {errors.distillery && <p className="text-red-400 text-xs mt-1">{errors.distillery}</p>}
            </div>

            <div>
              <label htmlFor="region" className="block text-sm font-medium text-limestone mb-1">
                Region *
              </label>
              <input
                id="region"
                type="text"
                value={formData.region}
                onChange={(e) => updateFormData("region", e.target.value)}
                className={`w-full bg-gray-900 border rounded-md p-2 text-parchment focus:ring-1 focus:ring-amber-dram transition ${
                  errors.region ? "border-red-400" : "border-gray-700 focus:border-amber-dram"
                }`}
                placeholder="e.g., Islay"
              />
              {errors.region && <p className="text-red-400 text-xs mt-1">{errors.region}</p>}
            </div>

            <div>
              <label htmlFor="age" className="block text-sm font-medium text-limestone mb-1">
                Age
              </label>
              <select
                id="age"
                value={formData.age}
                onChange={(e) =>
                  updateFormData(
                    "age",
                    e.target.value === "No Age Statement" ? "No Age Statement" : parseInt(e.target.value)
                  )
                }
                className={`w-full bg-gray-900 border rounded-md p-2 text-parchment focus:ring-1 focus:ring-amber-dram transition ${
                  errors.age ? "border-red-400" : "border-gray-700 focus:border-amber-dram"
                }`}
              >
                <option value="No Age Statement">No Age Statement</option>
                {Array.from({ length: 51 }, (_, i) => i + 3).map((age) => (
                  <option key={age} value={age}>
                    {age} years
                  </option>
                ))}
              </select>
              {errors.age && <p className="text-red-400 text-xs mt-1">{errors.age}</p>}
            </div>

            <div>
              <label htmlFor="abv" className="block text-sm font-medium text-limestone mb-1">
                ABV (%) *
              </label>
              <input
                id="abv"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.abv}
                onChange={(e) => updateFormData("abv", parseFloat(e.target.value))}
                className={`w-full bg-gray-900 border rounded-md p-2 text-parchment focus:ring-1 focus:ring-amber-dram transition ${
                  errors.abv ? "border-red-400" : "border-gray-700 focus:border-amber-dram"
                }`}
                placeholder="e.g., 43.0"
              />
              {errors.abv && <p className="text-red-400 text-xs mt-1">{errors.abv}</p>}
            </div>

            <div>
              <label htmlFor="caskType" className="block text-sm font-medium text-limestone mb-1">
                Cask Type *
              </label>
              <input
                id="caskType"
                type="text"
                value={formData.caskType}
                onChange={(e) => updateFormData("caskType", e.target.value)}
                className={`w-full bg-gray-900 border rounded-md p-2 text-parchment focus:ring-1 focus:ring-amber-dram transition ${
                  errors.caskType ? "border-red-400" : "border-gray-700 focus:border-amber-dram"
                }`}
                placeholder="e.g., Ex-Bourbon"
              />
              {errors.caskType && <p className="text-red-400 text-xs mt-1">{errors.caskType}</p>}
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="foodPairing" className="block text-sm font-medium text-limestone mb-1">
              Food Pairing *
            </label>
            <input
              id="foodPairing"
              type="text"
              value={formData.foodPairing}
              onChange={(e) => updateFormData("foodPairing", e.target.value)}
              className={`w-full bg-gray-900 border rounded-md p-2 text-parchment focus:ring-1 focus:ring-amber-dram transition ${
                errors.foodPairing ? "border-red-400" : "border-gray-700 focus:border-amber-dram"
              }`}
              placeholder="e.g., Dark chocolate and sea salt"
            />
            {errors.foodPairing && <p className="text-red-400 text-xs mt-1">{errors.foodPairing}</p>}
          </div>

          {/* Tasting Notes */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-limestone mb-1">Tasting Notes *</label>
            <div className="space-y-2">
              {formData.tastingNotes.map((note, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => {
                      const newNotes = [...formData.tastingNotes];
                      newNotes[index] = e.target.value;
                      updateFormData("tastingNotes", newNotes);
                    }}
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-md p-2 text-parchment focus:ring-1 focus:ring-amber-dram focus:border-amber-dram transition"
                    placeholder="e.g., Smoky, Peaty, Honey"
                  />
                  <button
                    type="button"
                    onClick={() => removeTastingNote(index)}
                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTastingNote}
                  onChange={(e) => setNewTastingNote(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTastingNote())}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-md p-2 text-parchment focus:ring-1 focus:ring-amber-dram focus:border-amber-dram transition"
                  placeholder="Add another tasting note"
                />
                <button
                  type="button"
                  onClick={addTastingNote}
                  className="p-2 bg-amber-dram text-parchment rounded-md hover:bg-amber-500 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            {errors.tastingNotes && <p className="text-red-400 text-xs mt-1">{errors.tastingNotes}</p>}
          </div>
        </div>

        {/* Experience Details Section */}
        <div className="bg-aged-oak border border-gray-700 rounded-lg p-6">
          <h2 className="font-serif text-xl font-semibold text-parchment mb-4">Experience Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="experienceDate" className="block text-sm font-medium text-limestone mb-1">
                Experience Date *
              </label>
              <input
                id="experienceDate"
                type="text"
                value={formData.experienceDate}
                onChange={(e) => updateFormData("experienceDate", e.target.value)}
                className={`w-full bg-gray-900 border rounded-md p-2 text-parchment focus:ring-1 focus:ring-amber-dram transition ${
                  errors.experienceDate ? "border-red-400" : "border-gray-700 focus:border-amber-dram"
                }`}
                placeholder="e.g., A cold winter evening in December"
              />
              {errors.experienceDate && <p className="text-red-400 text-xs mt-1">{errors.experienceDate}</p>}
            </div>

            <div>
              <label htmlFor="experienceLocation" className="block text-sm font-medium text-limestone mb-1">
                Experience Location *
              </label>
              <input
                id="experienceLocation"
                type="text"
                value={formData.experienceLocation}
                onChange={(e) => updateFormData("experienceLocation", e.target.value)}
                className={`w-full bg-gray-900 border rounded-md p-2 text-parchment focus:ring-1 focus:ring-amber-dram transition ${
                  errors.experienceLocation ? "border-red-400" : "border-gray-700 focus:border-amber-dram"
                }`}
                placeholder="e.g., A cozy pub in Edinburgh"
              />
              {errors.experienceLocation && <p className="text-red-400 text-xs mt-1">{errors.experienceLocation}</p>}
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="narrative" className="block text-sm font-medium text-limestone mb-1">
              Narrative *
            </label>
            <textarea
              id="narrative"
              rows={4}
              value={formData.narrative}
              onChange={(e) => updateFormData("narrative", e.target.value)}
              className={`w-full bg-gray-900 border rounded-md p-2 text-parchment focus:ring-1 focus:ring-amber-dram transition ${
                errors.narrative ? "border-red-400" : "border-gray-700 focus:border-amber-dram"
              }`}
              placeholder="Tell the story of your experience with this whisky..."
            />
            {errors.narrative && <p className="text-red-400 text-xs mt-1">{errors.narrative}</p>}
          </div>

          <div className="mt-4">
            <label htmlFor="finalVerdict" className="block text-sm font-medium text-limestone mb-1">
              Final Verdict *
            </label>
            <textarea
              id="finalVerdict"
              rows={2}
              value={formData.finalVerdict}
              onChange={(e) => updateFormData("finalVerdict", e.target.value)}
              className={`w-full bg-gray-900 border rounded-md p-2 text-parchment focus:ring-1 focus:ring-amber-dram transition ${
                errors.finalVerdict ? "border-red-400" : "border-gray-700 focus:border-amber-dram"
              }`}
              placeholder="Your final thoughts on this whisky..."
            />
            {errors.finalVerdict && <p className="text-red-400 text-xs mt-1">{errors.finalVerdict}</p>}
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
                Adding Experience...
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
            className="px-6 py-3 bg-gray-700 text-parchment rounded-lg hover:bg-gray-600 transition-colors"
          >
            Clear Form
          </button>
        </div>
      </form>
    </div>
  );
}
