import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const userId = request.cookies.get('75j_user_id')?.value;
  const { pathname } = request.nextUrl;

  // Allow login page, login API, cron endpoint (protégé par CRON_SECRET) et assets statiques
  if (pathname === '/login' || pathname === '/api/login' || pathname.startsWith('/api/cron/') || pathname.startsWith('/_next/') || pathname.startsWith('/sw.js') || pathname === '/manifest.webmanifest') {
    return NextResponse.next();
  }

  // Block everything else (pages + API routes) if not authenticated
  if (!userId || !['simon', 'emma'].includes(userId)) {
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
