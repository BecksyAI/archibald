/**
 * Admin users API route
 * Super admin can manage user roles
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { requireSuperAdmin, AuthenticatedRequest } from '@/lib/middleware';

// GET all users (super admin only)
export async function GET(request: NextRequest) {
  return requireSuperAdmin(request, async () => {
    try {
      await connectDB();

      const users = await User.find().select('-password').lean();

      const formattedUsers = users.map((user) => ({
        id: (user._id as { toString: () => string }).toString(),
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        claimed: user.claimed || false,
        claimedAt: user.claimedAt?.toISOString(),
        createdAt: user.createdAt.toISOString(),
      }));

      return NextResponse.json({ users: formattedUsers });
    } catch {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

// PUT update user role (super admin only)
async function updateUserHandler(request: AuthenticatedRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: 'UserId and role are required' }, { status: 400 });
    }

    if (!['user', 'admin', 'superadmin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Prevent removing superadmin from themselves
    if (userId === request.user.userId && role !== 'superadmin') {
      return NextResponse.json({ error: 'Cannot remove superadmin role from yourself' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only superadmin can assign superadmin role
    if (role === 'superadmin' && request.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Only superadmin can assign superadmin role' }, { status: 403 });
    }

    user.role = role;
    await user.save();

    return NextResponse.json({
      success: true,
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
  return requireSuperAdmin(request, updateUserHandler);
}

