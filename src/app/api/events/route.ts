/**
 * Events API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Event from '@/lib/models/Event';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware';

// GET all events
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const host = searchParams.get('host');
    const date = searchParams.get('date');

    const query: Record<string, unknown> = {};
    if (host) {
      query.host = { $regex: host, $options: 'i' };
    }
    if (date) {
      query.date = new Date(date);
    }

    const events = await Event.find(query)
      .sort({ date: -1 })
      .populate('createdBy', 'username displayName')
      .lean();

    const formattedEvents = events.map((event) => ({
      id: (event._id as { toString: () => string }).toString(),
      date: event.date.toISOString(),
      host: event.host,
      documented: event.documented,
      description: event.description,
      images: event.images || [],
      createdBy: event.createdBy?._id?.toString() || event.createdBy,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    }));

    return NextResponse.json({ events: formattedEvents });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new event
async function createHandler(request: AuthenticatedRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { date, host, documented, description, images } = body;

    if (!date || !host) {
      return NextResponse.json({ error: 'Date and host are required' }, { status: 400 });
    }

    const event = await Event.create({
      date: new Date(date),
      host: host.trim(),
      documented: documented !== undefined ? documented : 'TBD',
      description: description?.trim(),
      images: images || [],
      createdBy: request.user!.userId,
    });

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

    return NextResponse.json({ event: formattedEvent }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return requireAuth(request, createHandler);
}

