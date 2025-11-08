/**
 * Individual whisky entry API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import WhiskyEntry from '@/lib/models/WhiskyEntry';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware';

// GET whisky entry by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const whisky = await WhiskyEntry.findById(id)
      .populate('eventId', 'date host')
      .populate('createdBy', 'username displayName')
      .lean();

    if (!whisky) {
      return NextResponse.json({ error: 'Whisky entry not found' }, { status: 404 });
    }

    const whiskyData = whisky as unknown as {
      _id: { toString: () => string };
      name: string;
      eventId?: { _id?: { toString: () => string }; toString?: () => string } | { toString: () => string };
      eventDate: Date;
      host: string;
      countryOfOrigin: string;
      age?: number | string;
      description?: string;
      aromaNotes?: string;
      tasteNotes?: string;
      finishNotes?: string;
      images: string[];
      createdBy?: { _id?: { toString: () => string }; toString?: () => string } | { toString: () => string };
      createdAt: Date;
      updatedAt: Date;
    };

    const formattedWhisky = {
      id: whiskyData._id.toString(),
      name: whiskyData.name,
      eventId: whiskyData.eventId ? ((whiskyData.eventId as { _id?: { toString: () => string } })._id?.toString() || (whiskyData.eventId as { toString?: () => string }).toString?.() || '') : '',
      eventDate: whiskyData.eventDate.toISOString(),
      host: whiskyData.host,
      countryOfOrigin: whiskyData.countryOfOrigin,
      age: whiskyData.age,
      description: whiskyData.description,
      aromaNotes: whiskyData.aromaNotes,
      tasteNotes: whiskyData.tasteNotes,
      finishNotes: whiskyData.finishNotes,
      images: whiskyData.images || [],
      createdBy: whiskyData.createdBy ? ((whiskyData.createdBy as { _id?: { toString: () => string } })._id?.toString() || (whiskyData.createdBy as { toString?: () => string }).toString?.() || '') : '',
      createdAt: whiskyData.createdAt.toISOString(),
      updatedAt: whiskyData.updatedAt.toISOString(),
    };

    return NextResponse.json({ whisky: formattedWhisky });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update whisky entry
async function updateHandler(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const whisky = await WhiskyEntry.findById(id);
    if (!whisky) {
      return NextResponse.json({ error: 'Whisky entry not found' }, { status: 404 });
    }

    // Check if user is admin or creator
    if (whisky.createdBy.toString() !== request.user.userId && request.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      eventId,
      eventDate,
      host,
      countryOfOrigin,
      age,
      description,
      aromaNotes,
      tasteNotes,
      finishNotes,
      images,
    } = body;

    if (name) whisky.name = name.trim();
    if (eventId) whisky.eventId = eventId;
    if (eventDate) whisky.eventDate = new Date(eventDate);
    if (host) whisky.host = host.trim();
    if (countryOfOrigin) whisky.countryOfOrigin = countryOfOrigin.trim();
    if (age !== undefined) whisky.age = age;
    if (description !== undefined) whisky.description = description?.trim();
    if (aromaNotes !== undefined) whisky.aromaNotes = aromaNotes?.trim();
    if (tasteNotes !== undefined) whisky.tasteNotes = tasteNotes?.trim();
    if (finishNotes !== undefined) whisky.finishNotes = finishNotes?.trim();
    if (images !== undefined) whisky.images = images;

    await whisky.save();

    const formattedWhisky = {
      id: whisky._id.toString(),
      name: whisky.name,
      eventId: whisky.eventId.toString(),
      eventDate: whisky.eventDate.toISOString(),
      host: whisky.host,
      countryOfOrigin: whisky.countryOfOrigin,
      age: whisky.age,
      description: whisky.description,
      aromaNotes: whisky.aromaNotes,
      tasteNotes: whisky.tasteNotes,
      finishNotes: whisky.finishNotes,
      images: whisky.images || [],
      createdBy: whisky.createdBy.toString(),
      createdAt: whisky.createdAt.toISOString(),
      updatedAt: whisky.updatedAt.toISOString(),
    };

    return NextResponse.json({ whisky: formattedWhisky });
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

// DELETE whisky entry
async function deleteHandler(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const whisky = await WhiskyEntry.findById(id);
    if (!whisky) {
      return NextResponse.json({ error: 'Whisky entry not found' }, { status: 404 });
    }

    // Check if user is admin or creator
    if (whisky.createdBy.toString() !== request.user.userId && request.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await whisky.deleteOne();

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
