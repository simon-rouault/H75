import { NextRequest, NextResponse } from 'next/server';

const VALID_USERS = ['simon', 'emma'];

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId || !VALID_USERS.includes(userId)) {
      return NextResponse.json({ error: 'Utilisateur invalide' }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set('75j_user_id', userId, {
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
