/**
 * Individual image API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Image from '@/lib/models/Image';
import Event from '@/lib/models/Event';
import WhiskyEntry from '@/lib/models/WhiskyEntry';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware';

// GET image by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const image = await Image.findById(id).lean();

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const imageData = image as unknown as {
      _id: { toString: () => string };
      url: string;
      filename: string;
      contentType: string;
      size: number;
      eventId?: { toString: () => string };
      whiskyEntryId?: { toString: () => string };
      createdAt: Date;
    };

    return NextResponse.json({
      image: {
        id: imageData._id.toString(),
        url: imageData.url,
        filename: imageData.filename,
        contentType: imageData.contentType,
        size: imageData.size,
        eventId: imageData.eventId?.toString(),
        whiskyEntryId: imageData.whiskyEntryId?.toString(),
        createdAt: imageData.createdAt.toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE image
async function deleteHandler(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const image = await Image.findById(id);
    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Check if user is admin or uploader
    if (image.uploadedBy.toString() !== request.user.userId && request.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Remove image from event or whisky entry
    if (image.eventId) {
      const event = await Event.findById(image.eventId);
      if (event) {
        event.images = event.images.filter((img: string) => img !== image._id.toString());
        await event.save();
      }
    }

    if (image.whiskyEntryId) {
      const whisky = await WhiskyEntry.findById(image.whiskyEntryId);
      if (whisky) {
        whisky.images = whisky.images.filter((img: string) => img !== image._id.toString());
        await whisky.save();
      }
    }

    await image.deleteOne();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (req) => deleteHandler(req, { params }));
}
