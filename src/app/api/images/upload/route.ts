/**
 * Image upload API route
 * Supports uploading images for events and whisky entries
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware';
import connectDB from '@/lib/db';
import Image from '@/lib/models/Image';
import Event from '@/lib/models/Event';
import WhiskyEntry from '@/lib/models/WhiskyEntry';

async function uploadHandler(request: AuthenticatedRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const eventId = formData.get('eventId') as string | null;
    const whiskyEntryId = formData.get('whiskyEntryId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Convert file to base64 or buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // For now, store as base64 in database
    // In production, you'd want to use GridFS or cloud storage
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Create image record
    const image = await Image.create({
      filename: file.name,
      contentType: file.type,
      size: file.size,
      url: dataUrl, // Store base64 data URL
      eventId: eventId || undefined,
      whiskyEntryId: whiskyEntryId || undefined,
      uploadedBy: request.user.userId,
    });

    // Update event or whisky entry with image URL
    if (eventId) {
      const event = await Event.findById(eventId);
      if (event) {
        event.images = [...(event.images || []), image._id.toString()];
        await event.save();
      }
    }

    if (whiskyEntryId) {
      const whisky = await WhiskyEntry.findById(whiskyEntryId);
      if (whisky) {
        whisky.images = [...(whisky.images || []), image._id.toString()];
        await whisky.save();
      }
    }

    return NextResponse.json({
      success: true,
      image: {
        id: image._id.toString(),
        url: image.url,
        filename: image.filename,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return requireAuth(request, uploadHandler);
}

