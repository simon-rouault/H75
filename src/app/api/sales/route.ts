import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUser(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId || userId !== auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from('sales')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Sales fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
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
    const { data } = await supabase.from('sales').insert(body).select().single();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Sale create error:', error);
    return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 });
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
    // Only delete if the sale belongs to the authenticated user
    await supabase.from('sales').delete().eq('id', id).eq('user_id', auth);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sale delete error:', error);
    return NextResponse.json({ error: 'Failed to delete sale' }, { status: 500 });
  }
}
