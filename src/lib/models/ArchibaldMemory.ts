/**
 * Archibald Core Memory model for MongoDB
 * Stores Archibald's whisky experiences from whisky_experiences.json
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IWhiskyDetails {
  name: string;
  distillery: string;
  region: string;
  age: number | string;
  abv: number;
  tastingNotes: string[];
  caskType: string;
  foodPairing: string;
}

export interface IArchibaldMemory extends Document {
  id: number;
  whiskyDetails: IWhiskyDetails;
  experienceDate: string;
  experienceLocation: string;
  narrative: string;
  finalVerdict: string;
  createdAt: Date;
  updatedAt: Date;
}

const WhiskyDetailsSchema = new Schema<IWhiskyDetails>({
  name: { type: String, required: true },
  distillery: { type: String, required: true },
  region: { type: String, required: true },
  age: { type: Schema.Types.Mixed, required: true },
  abv: { type: Number, required: true },
  tastingNotes: [String],
  caskType: { type: String, required: true },
  foodPairing: { type: String, required: true },
}, { _id: false });

const ArchibaldMemorySchema = new Schema<IArchibaldMemory>(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    whiskyDetails: {
      type: WhiskyDetailsSchema,
      required: true,
    },
    experienceDate: {
      type: String,
      required: true,
    },
    experienceLocation: {
      type: String,
      required: true,
    },
    narrative: {
      type: String,
      required: true,
    },
    finalVerdict: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Note: id index is created automatically by unique: true and index: true
ArchibaldMemorySchema.index({ 'whiskyDetails.name': 1 });

export default mongoose.models.ArchibaldMemory || mongoose.model<IArchibaldMemory>('ArchibaldMemory', ArchibaldMemorySchema);

