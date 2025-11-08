/**
 * Archibald Persona model for MongoDB
 * Stores Archibald's personality and core directives
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IArchibaldPersona extends Document {
  name: string;
  age: string;
  appearanceProjection: string;
  originStory: string;
  personalityMatrix: {
    trait: string;
    description: string;
  }[];
  catchphrases: string[];
  coreDirectives: string[];
  updatedAt: Date;
  createdAt: Date;
}

const ArchibaldPersonaSchema = new Schema<IArchibaldPersona>(
  {
    name: {
      type: String,
      required: true,
      default: 'Archibald Ignatius "A.I." Sterling',
    },
    age: {
      type: String,
      required: true,
    },
    appearanceProjection: {
      type: String,
      required: true,
    },
    originStory: {
      type: String,
      required: true,
    },
    personalityMatrix: [
      {
        trait: String,
        description: String,
      },
    ],
    catchphrases: [String],
    coreDirectives: [String],
  },
  {
    timestamps: true,
  }
);

// Only one persona document should exist
ArchibaldPersonaSchema.index({ name: 1 }, { unique: true });

export default mongoose.models.ArchibaldPersona || mongoose.model<IArchibaldPersona>('ArchibaldPersona', ArchibaldPersonaSchema);

