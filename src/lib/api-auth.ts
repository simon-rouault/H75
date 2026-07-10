import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-token';

/**
 * Extract and validate the authenticated user from the signed cookie.
 * Returns the userId or a 401 response.
 */
export async function getAuthUser(request: NextRequest): Promise<string | NextResponse> {
  const userId = await verifyToken(request.cookies.get('75j_user_id')?.value);
  if (!userId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  return userId;
}

/**
 * Simple in-memory rate limiter per user.
 * Resets every `windowMs` milliseconds.
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(userId: string, maxRequests: number = 50, windowMs: number = 24 * 60 * 60 * 1000): NextResponse | null {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + windowMs });
    return null;
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return NextResponse.json(
      { error: `Limite atteinte (${maxRequests} analyses/jour). Réessaie demain.` },
      { status: 429 }
    );
  }

  return null;
}
