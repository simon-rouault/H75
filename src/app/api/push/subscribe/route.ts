import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/api-auth';

const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(request: NextRequest) {
  const auth = getAuthUser(request);
  if (auth instanceof NextResponse) return auth;

  const { subscription, time, timezone } = await request.json();
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: 'Abonnement invalide' }, { status: 400 });
  }

  const { error } = await db()
    .from('push_subscriptions')
    .upsert(
      {
        endpoint: subscription.endpoint,
        user_id: auth,
        subscription,
        reminder_time: time || '20:00',
        timezone: timezone || 'Europe/Paris',
      },
      { onConflict: 'endpoint' }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
