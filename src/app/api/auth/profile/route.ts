/**
 * Update user profile API route
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware';
import { hashPassword, comparePassword } from '@/lib/auth';

async function handler(request: AuthenticatedRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { displayName, password, currentPassword } = body;

    const user = await User.findById(request.user!.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update display name
    if (displayName) {
      user.displayName = displayName.trim();
    }

    // Update password
    if (password) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
      }

      const isValid = await comparePassword(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }

      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }

      user.password = await hashPassword(password);
    }

    await user.save();

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return requireAuth(request, handler);
}

