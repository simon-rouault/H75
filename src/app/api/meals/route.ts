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
    let query = supabase.from('meals').select('*').eq('user_id', userId);

    if (date) query = query.eq('date', date);

    const { data } = await query.order('created_at', { ascending: true });

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Meals fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch meals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUser(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();

    if (body.user_id !== auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.from('meals').insert(body).select().single();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Meal create error:', error);
    return NextResponse.json({ error: 'Failed to create meal' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = getAuthUser(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    // Only delete if the meal belongs to the authenticated user
    await supabase.from('meals').delete().eq('id', id).eq('user_id', auth);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Meal delete error:', error);
    return NextResponse.json({ error: 'Failed to delete meal' }, { status: 500 });
  }
}
