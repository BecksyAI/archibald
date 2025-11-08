/**
 * Individual review API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Review from '@/lib/models/Review';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware';

// GET review by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const review = await Review.findById(id)
      .populate('whiskyEntryId', 'name')
      .populate('eventId', 'date host')
      .populate('createdBy', 'username displayName')
      .lean();

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const reviewData = review as unknown as {
      _id: { toString: () => string };
      whiskyEntryId?: { _id?: { toString: () => string }; name?: string; toString?: () => string } | { toString: () => string };
      eventId?: { _id?: { toString: () => string }; toString?: () => string } | { toString: () => string };
      participantName: string;
      participantUserId?: { toString: () => string };
      verdict: string;
      notes?: string;
      createdBy?: { _id?: { toString: () => string }; toString?: () => string } | { toString: () => string };
      createdAt: Date;
      updatedAt: Date;
    };

    const formattedReview = {
      id: reviewData._id.toString(),
      whiskyEntryId: reviewData.whiskyEntryId ? ((reviewData.whiskyEntryId as { _id?: { toString: () => string } })._id?.toString() || (reviewData.whiskyEntryId as { toString?: () => string }).toString?.() || '') : '',
      whiskyName: reviewData.whiskyEntryId ? ((reviewData.whiskyEntryId as { name?: string }).name || 'Unknown') : 'Unknown',
      eventId: reviewData.eventId ? ((reviewData.eventId as { _id?: { toString: () => string } })._id?.toString() || (reviewData.eventId as { toString?: () => string }).toString?.() || '') : '',
      participantName: reviewData.participantName,
      participantUserId: reviewData.participantUserId?.toString(),
      verdict: reviewData.verdict,
      notes: reviewData.notes,
      createdBy: reviewData.createdBy ? ((reviewData.createdBy as { _id?: { toString: () => string } })._id?.toString() || (reviewData.createdBy as { toString?: () => string }).toString?.() || '') : '',
      createdAt: reviewData.createdAt.toISOString(),
      updatedAt: reviewData.updatedAt.toISOString(),
    };

    return NextResponse.json({ review: formattedReview });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update review
async function updateHandler(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Check if user is admin or creator
    if (review.createdBy.toString() !== request.user.userId && request.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { participantName, participantUserId, verdict, notes } = body;

    if (participantName) review.participantName = participantName.trim();
    if (participantUserId !== undefined) review.participantUserId = participantUserId || undefined;
    if (verdict) review.verdict = verdict.trim();
    if (notes !== undefined) review.notes = notes?.trim();

    await review.save();

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

    return NextResponse.json({ review: formattedReview });
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

// DELETE review
async function deleteHandler(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Check if user is admin or creator
    if (review.createdBy.toString() !== request.user.userId && request.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await review.deleteOne();

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
