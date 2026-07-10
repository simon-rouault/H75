import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient as createServerClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const authResult = await getAuthUser(request);
  if (authResult instanceof NextResponse) return authResult;

  const userId = request.nextUrl.searchParams.get('userId') ?? authResult;
  if (userId !== authResult) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('weight_logs')
    .select('date, weight_kg')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const authResult = await getAuthUser(request);
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json() as { userId?: string; date?: string; weight_kg?: number };
  if (body.userId && body.userId !== authResult) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { date, weight_kg } = body;
  if (!date || weight_kg === undefined || weight_kg < 20 || weight_kg > 400) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('weight_logs')
    .upsert({ user_id: authResult, date, weight_kg }, { onConflict: 'user_id,date' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
