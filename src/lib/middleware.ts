/**
 * API route middleware for authentication and authorization
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload } from './auth';
import connectDB from './db';
import User from './models/User';

export interface AuthenticatedRequest extends NextRequest {
  user: JWTPayload & { role: 'user' | 'admin' | 'superadmin' };
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const token = getTokenFromRequest(request.headers);

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Get user from database to verify they still exist and get role
  await connectDB();
  const user = await User.findById(payload.userId).lean();

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  const authReq = request as AuthenticatedRequest;
  const userData = user as unknown as { role: 'user' | 'admin' | 'superadmin' };
  authReq.user = {
    ...payload,
    role: userData.role,
  };

  return handler(authReq);
}

/**
 * Middleware to require admin role
 */
export async function requireAdmin(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return handler(req);
  });
}

/**
 * Middleware to require super admin role
 */
export async function requireSuperAdmin(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    if (req.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }
    return handler(req);
  });
}

/**
 * Get token from request headers
 */
function getTokenFromRequest(headers: Headers): string | null {
  const authHeader = headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Also check cookies
  const cookies = headers.get('cookie');
  if (cookies) {
    const tokenMatch = cookies.match(/token=([^;]+)/);
    if (tokenMatch) {
      return tokenMatch[1];
    }
  }

  return null;
}
