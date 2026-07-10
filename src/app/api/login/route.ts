import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/auth-token';

const VALID_USERS = ['simon', 'emma'];

export async function POST(request: NextRequest) {
  try {
    const { userId, pin } = await request.json();

    if (!userId || !VALID_USERS.includes(userId)) {
      return NextResponse.json({ error: 'Utilisateur invalide' }, { status: 400 });
    }

    const expectedPin = process.env.APP_PIN;
    if (expectedPin && String(pin ?? '') !== String(expectedPin)) {
      return NextResponse.json({ error: 'Code incorrect' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set('75j_user_id', await signToken(userId), {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Erreur de connexion' }, { status: 500 });
  }
}
