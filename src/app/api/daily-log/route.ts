import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUser(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const date = searchParams.get('date');

    if (!userId || userId !== auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const supabase = await createServerSupabaseClient();

    if (date) {
      const { data } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single();

      return NextResponse.json(data);
    }

    const { data } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Daily log fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch daily log' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = getAuthUser(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { user_id, date, ...updates } = body;

    if (!user_id || !date || user_id !== auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const supabase = await createServerSupabaseClient();

    const { data } = await supabase
      .from('daily_logs')
      .upsert(
        { user_id, date, ...updates },
        { onConflict: 'user_id,date' }
      )
      .select()
      .single();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Daily log update error:', error);
    return NextResponse.json({ error: 'Failed to update daily log' }, { status: 500 });
  }
}
