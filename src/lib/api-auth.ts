import { NextRequest, NextResponse } from 'next/server';

const VALID_USERS = ['simon', 'emma'];

/**
 * Extract and validate the authenticated user from the cookie.
 * Returns the userId or a 401 response.
 */
export function getAuthUser(request: NextRequest): string | NextResponse {
  const userId = request.cookies.get('75j_user_id')?.value;
  if (!userId || !VALID_USERS.includes(userId)) {
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
