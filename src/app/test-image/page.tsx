/**
 * Test page to preview whisky image
 */

"use client";

import React from "react";
import { MapPin, Calendar, Wine } from "lucide-react";

export default function TestImagePage() {
  return (
    <div className="min-h-screen bg-peat-smoke p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-serif text-parchment mb-6">Image Test - Glenfiddich 12</h1>
        
        {/* Test Card with Image */}
        <div className="bg-aged-oak border border-gray-700 rounded-lg p-6 hover:border-amber-dram/50 transition-colors">
          {/* Whisky Image */}
          <div className="mb-4 aspect-video bg-gray-900 rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/glen12.png"
              alt="Glenfiddich 12"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Whisky Details */}
          <div className="mb-4">
            <h3 className="font-serif text-xl font-semibold text-parchment mb-2">Glenfiddich 12</h3>
            <div className="space-y-1 text-sm text-limestone">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Scotland</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>8/17/2024</span>
              </div>
              <div className="flex items-center gap-2">
                <Wine className="h-4 w-4" />
                <span>Host: Michael</span>
              </div>
              <div className="text-amber-dram">
                Age: 12 years
              </div>
            </div>
          </div>

          {/* View Details Button */}
          <button
            className="w-full mt-4 px-4 py-2 border border-gray-700 text-parchment rounded-lg hover:bg-gray-700/50 transition-colors text-sm"
          >
            View Details
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-gray-900/50 rounded-lg">
          <h2 className="text-lg font-semibold text-parchment mb-2">How to add this image to a whisky entry:</h2>
          <ol className="list-decimal list-inside space-y-2 text-limestone text-sm">
            <li>Go to the Whisky Collection page</li>
            <li>Click &quot;Add Whisky&quot; button</li>
            <li>Fill in the whisky details (Name: &quot;Glenfiddich 12&quot;, Country: &quot;Scotland&quot;, etc.)</li>
            <li>In the images field, add: <code className="bg-gray-800 px-2 py-1 rounded">/glen12.png</code></li>
            <li>Submit the form</li>
          </ol>
          <p className="mt-4 text-sm text-limestone">
            The image is stored in the <code className="bg-gray-800 px-2 py-1 rounded">public</code> folder, 
            so it can be referenced directly as <code className="bg-gray-800 px-2 py-1 rounded">/glen12.png</code>
          </p>
        </div>
      </div>
    </div>
  );
}

