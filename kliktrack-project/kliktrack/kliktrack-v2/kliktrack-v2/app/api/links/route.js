import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: links, error } = await supabase
      .from('links')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const { data: clickCounts, error: countError } = await supabase
      .from('clicks')
      .select('link_id, id');

    if (countError) throw countError;

    const counts = {};
    clickCounts?.forEach(c => {
      counts[c.link_id] = (counts[c.link_id] || 0) + 1;
    });

    const linksWithCounts = links.map(link => ({
      ...link,
      clicks: counts[link.id] || 0,
    }));

    return NextResponse.json({ links: linksWithCounts });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { url, label } = await request.json();

    if (!url || !label) {
      return NextResponse.json({ error: 'URL dan label wajib diisi' }, { status: 400 });
    }

    const slug = Math.random().toString(36).substring(2, 8);

    const { data, error } = await supabase
      .from('links')
      .insert({ url, label, slug })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ link: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    await supabase.from('clicks').delete().eq('link_id', id);
    const { error } = await supabase.from('links').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
