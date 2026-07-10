import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-token';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page, login API, and static assets
  if (pathname === '/login' || pathname === '/api/login' || pathname.startsWith('/_next/') || pathname.startsWith('/sw.js') || pathname === '/manifest.webmanifest') {
    return NextResponse.next();
  }

  const userId = await verifyToken(request.cookies.get('75j_user_id')?.value);

  // Block everything else (pages + API routes) if not authenticated
  if (!userId) {
    // API routes get a 401 JSON response
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    // Pages get redirected to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Exclude Next internals and public static assets (images/icons) from auth.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)'],
};
