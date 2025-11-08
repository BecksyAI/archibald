/**
 * Image model for MongoDB
 * Can use GridFS or store URLs/IDs
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IImage extends Document {
  filename: string;
  contentType: string;
  size: number;
  url?: string;
  gridfsId?: string;
  eventId?: mongoose.Types.ObjectId;
  whiskyEntryId?: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ImageSchema = new Schema<IImage>(
  {
    filename: {
      type: String,
      required: true,
    },
    contentType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
    },
    gridfsId: {
      type: String,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
    },
    whiskyEntryId: {
      type: Schema.Types.ObjectId,
      ref: 'WhiskyEntry',
    },
    uploadedBy: {
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
ImageSchema.index({ eventId: 1 });
ImageSchema.index({ whiskyEntryId: 1 });
ImageSchema.index({ uploadedBy: 1 });

export default mongoose.models.Image || mongoose.model<IImage>('Image', ImageSchema);

