/**
 * User registration API route
 * Supports account claiming by username match
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { username, password, displayName } = body;

    // Validation
    if (!username || !password || !displayName) {
      return NextResponse.json(
        { error: 'Username, password, and display name are required' },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 30) {
      return NextResponse.json(
        { error: 'Username must be between 3 and 30 characters' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username: username.toLowerCase().trim() });

    if (existingUser) {
      // Check if it's an unclaimed account (created during migration)
      if (!existingUser.claimed) {
        // User is claiming an existing account
        // Verify password is being set (they're claiming it)
        const hashedPassword = await hashPassword(password);
        
        existingUser.password = hashedPassword;
        existingUser.displayName = displayName || existingUser.displayName;
        existingUser.claimed = true;
        existingUser.claimedAt = new Date();
        
        // Check if this is NAETICUS (super admin)
        if (username.toLowerCase() === 'naeticus') {
          existingUser.role = 'superadmin';
        } else {
          // All other claimed accounts get admin
          existingUser.role = 'admin';
        }
        
        await existingUser.save();

        // Generate token for claimed account
        const { generateToken } = await import('@/lib/auth');
        const token = generateToken({
          userId: existingUser._id.toString(),
          username: existingUser.username,
          role: existingUser.role,
        });

        return NextResponse.json({
          success: true,
          message: 'Account claimed successfully',
          token,
          user: {
            id: existingUser._id.toString(),
            username: existingUser.username,
            displayName: existingUser.displayName,
            role: existingUser.role,
            claimed: true,
          },
        });
      } else {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 400 }
        );
      }
    }

    // Create new user
    const hashedPassword = await hashPassword(password);
    
    // Check if this is NAETICUS (super admin)
    const role = username.toLowerCase() === 'naeticus' ? 'superadmin' : 'user';
    
    const user = await User.create({
      username: username.toLowerCase().trim(),
      password: hashedPassword,
      displayName: displayName.trim(),
      role,
      claimed: true, // New accounts are automatically claimed
      claimedAt: new Date(),
    });

    // Generate token for new account
    const { generateToken } = await import('@/lib/auth');
    const token = generateToken({
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        claimed: true,
      },
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Registration failed' },
      { status: 500 }
    );
  }
}
