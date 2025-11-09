/**
 * Suggestions API route
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Suggestion from '@/lib/models/Suggestion';
import { requireAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  return requireAuth(request, async (req) => {
    try {
      await connectDB();

      // Check if user is admin
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

    const suggestions = await Suggestion.find()
      .populate('createdBy', 'username displayName')
      .sort({ createdAt: -1 })
      .lean();

    const formattedSuggestions = suggestions.map((suggestion) => {
      const sug = suggestion as unknown as {
        _id: { toString: () => string };
        text: string;
        createdBy: { username: string; displayName: string } | { toString: () => string };
        createdAt: Date;
        updatedAt: Date;
      };

      return {
        id: sug._id.toString(),
        text: sug.text,
        createdBy: typeof sug.createdBy === 'object' && sug.createdBy !== null && 'username' in sug.createdBy
          ? {
              username: sug.createdBy.username,
              displayName: sug.createdBy.displayName,
            }
          : { username: 'Unknown', displayName: 'Unknown' },
        createdAt: sug.createdAt instanceof Date ? sug.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: sug.updatedAt instanceof Date ? sug.updatedAt.toISOString() : new Date().toISOString(),
      };
    });

      return NextResponse.json({ suggestions: formattedSuggestions });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to fetch suggestions' },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return requireAuth(request, async (req) => {
    try {
      await connectDB();

      const user = req.user;
    const body = await request.json();
    const { text } = body as { text: string };

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Suggestion text is required' }, { status: 400 });
    }

      const suggestion = new Suggestion({
        text: text.trim(),
        createdBy: user.userId,
      });

      await suggestion.save();

      // Get user details for response
      await connectDB();
      const User = (await import('@/lib/models/User')).default;
      const userDoc = await User.findById(user.userId).lean();
      const userData = userDoc as unknown as { username: string; displayName: string } | null;

      return NextResponse.json({
        success: true,
        suggestion: {
          id: suggestion._id.toString(),
          text: suggestion.text,
          createdBy: {
            username: userData?.username || 'Unknown',
            displayName: userData?.displayName || 'Unknown',
          },
          createdAt: suggestion.createdAt.toISOString(),
          updatedAt: suggestion.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to create suggestion' },
        { status: 500 }
      );
    }
  });
}

