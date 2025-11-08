/**
 * Review model for MongoDB
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  whiskyEntryId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  participantName: string;
  participantUserId?: mongoose.Types.ObjectId;
  verdict: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    whiskyEntryId: {
      type: Schema.Types.ObjectId,
      ref: 'WhiskyEntry',
      required: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    participantName: {
      type: String,
      required: true,
      trim: true,
    },
    participantUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
    },
    verdict: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
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
ReviewSchema.index({ whiskyEntryId: 1 });
ReviewSchema.index({ eventId: 1 });
ReviewSchema.index({ participantName: 1 });
ReviewSchema.index({ participantUserId: 1 }, { sparse: true }); // Sparse index - only indexes documents where field exists
ReviewSchema.index({ createdBy: 1 });

export default mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

