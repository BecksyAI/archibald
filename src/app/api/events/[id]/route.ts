/**
 * Individual event API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Event from '@/lib/models/Event';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware';

// GET event by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const event = await Event.findById(id)
      .populate('createdBy', 'username displayName')
      .lean();

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const eventData = event as unknown as {
      _id: { toString: () => string };
      date: Date;
      host: string;
      documented: boolean | 'TBD';
      description?: string;
      images: string[];
      createdBy?: { _id?: { toString: () => string } } | { toString: () => string };
      createdAt: Date;
      updatedAt: Date;
    };

    const formattedEvent = {
      id: eventData._id.toString(),
      date: eventData.date.toISOString(),
      host: eventData.host,
      documented: eventData.documented,
      description: eventData.description,
      images: eventData.images || [],
      createdBy: (eventData.createdBy as { _id?: { toString: () => string } })?._id?.toString() || (eventData.createdBy as { toString: () => string })?.toString() || '',
      createdAt: eventData.createdAt.toISOString(),
      updatedAt: eventData.updatedAt.toISOString(),
    };

    return NextResponse.json({ event: formattedEvent });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update event
async function updateHandler(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if user is admin or creator
    if (event.createdBy.toString() !== request.user!.userId && request.user!.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { date, host, documented, description, images } = body;

    if (date) event.date = new Date(date);
    if (host) event.host = host.trim();
    if (documented !== undefined) event.documented = documented;
    if (description !== undefined) event.description = description?.trim();
    if (images !== undefined) event.images = images;

    await event.save();

    const formattedEvent = {
      id: event._id.toString(),
      date: event.date.toISOString(),
      host: event.host,
      documented: event.documented,
      description: event.description,
      images: event.images || [],
      createdBy: event.createdBy.toString(),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };

    return NextResponse.json({ event: formattedEvent });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (req) => updateHandler(req, { params }));
}

// DELETE event
async function deleteHandler(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if user is admin or creator
    if (event.createdBy.toString() !== request.user!.userId && request.user!.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await event.deleteOne();

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

