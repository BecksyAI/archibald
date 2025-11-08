/**
 * Reviews API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Review from '@/lib/models/Review';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware';

// GET all reviews
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const whiskyEntryId = searchParams.get('whiskyEntryId');
    const eventId = searchParams.get('eventId');
    const participantName = searchParams.get('participantName');

    const query: Record<string, unknown> = {};
    if (whiskyEntryId) {
      query.whiskyEntryId = whiskyEntryId;
    }
    if (eventId) {
      query.eventId = eventId;
    }
    if (participantName) {
      query.participantName = { $regex: participantName, $options: 'i' };
    }

    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .populate('whiskyEntryId', 'name')
      .populate('eventId', 'date host')
      .lean();

    const formattedReviews = reviews.map((review) => ({
      id: (review._id as { toString: () => string }).toString(),
      whiskyEntryId: review.whiskyEntryId?._id?.toString() || review.whiskyEntryId?.toString(),
      whiskyName: review.whiskyEntryId?.name || 'Unknown',
      eventId: review.eventId?._id?.toString() || review.eventId?.toString(),
      participantName: review.participantName,
      participantUserId: review.participantUserId?.toString(),
      verdict: review.verdict,
      notes: review.notes,
      createdBy: review.createdBy.toString(),
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
    }));

    return NextResponse.json({ reviews: formattedReviews });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new review
async function createHandler(request: AuthenticatedRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { whiskyEntryId, eventId, participantName, participantUserId, verdict, notes } = body;

    if (!whiskyEntryId || !eventId || !participantName || !verdict) {
      return NextResponse.json(
        { error: 'WhiskyEntryId, eventId, participantName, and verdict are required' },
        { status: 400 }
      );
    }

    const review = await Review.create({
      whiskyEntryId,
      eventId,
      participantName: participantName.trim(),
      participantUserId: participantUserId || undefined,
      verdict: verdict.trim(),
      notes: notes?.trim(),
      createdBy: request.user.userId,
    });

    const formattedReview = {
      id: review._id.toString(),
      whiskyEntryId: review.whiskyEntryId.toString(),
      eventId: review.eventId.toString(),
      participantName: review.participantName,
      participantUserId: review.participantUserId?.toString(),
      verdict: review.verdict,
      notes: review.notes,
      createdBy: review.createdBy.toString(),
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
    };

    return NextResponse.json({ review: formattedReview }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return requireAuth(request, createHandler);
}

