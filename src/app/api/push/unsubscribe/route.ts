import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/api-auth';

const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(request: NextRequest) {
  const auth = getAuthUser(request);
  if (auth instanceof NextResponse) return auth;

  const { endpoint } = await request.json();
  if (endpoint) {
    await db().from('push_subscriptions').delete().eq('endpoint', endpoint);
  }
  return NextResponse.json({ ok: true });
}
