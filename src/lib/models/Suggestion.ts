/**
 * Suggestion model for MongoDB
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ISuggestion extends Document {
  text: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SuggestionSchema = new Schema<ISuggestion>(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
SuggestionSchema.index({ createdAt: -1 });
SuggestionSchema.index({ createdBy: 1 });

export default mongoose.models.Suggestion || mongoose.model<ISuggestion>('Suggestion', SuggestionSchema);

