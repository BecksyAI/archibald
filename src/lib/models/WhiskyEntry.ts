/**
 * WhiskyEntry model for MongoDB
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IWhiskyEntry extends Document {
  name: string;
  eventId?: mongoose.Types.ObjectId;
  eventDate: Date;
  host: string;
  countryOfOrigin: string;
  age?: number | string;
  description?: string;
  aromaNotes?: string;
  tasteNotes?: string;
  finishNotes?: string;
  images: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WhiskyEntrySchema = new Schema<IWhiskyEntry>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: false,
    },
    eventDate: {
      type: Date,
      required: true,
    },
    host: {
      type: String,
      required: true,
      trim: true,
    },
    countryOfOrigin: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Schema.Types.Mixed,
    },
    description: {
      type: String,
      trim: true,
    },
    aromaNotes: {
      type: String,
      trim: true,
    },
    tasteNotes: {
      type: String,
      trim: true,
    },
    finishNotes: {
      type: String,
      trim: true,
    },
    images: [
      {
        type: String,
      },
    ],
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
WhiskyEntrySchema.index({ name: 1 });
WhiskyEntrySchema.index({ eventId: 1 });
WhiskyEntrySchema.index({ eventDate: -1 });
WhiskyEntrySchema.index({ host: 1 });
WhiskyEntrySchema.index({ countryOfOrigin: 1 });

export default mongoose.models.WhiskyEntry || mongoose.model<IWhiskyEntry>('WhiskyEntry', WhiskyEntrySchema);

