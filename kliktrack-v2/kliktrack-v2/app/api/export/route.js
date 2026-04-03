import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const since = new Date();
    since.setDate(since.getDate() - days);

    // Get all clicks with link info
    const { data: clicks, error } = await supabase
      .from('clicks')
      .select('*, links(label, slug, url)')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Build CSV
    const headers = [
      'Tanggal', 'Waktu', 'Link Label', 'Link Slug', 'URL Tujuan',
      'Device', 'Browser', 'Negara', 'Kota', 'Region',
      'UTM Source', 'UTM Medium', 'UTM Campaign', 'UTM Content', 'UTM Term',
      'Referer', 'IP Address'
    ];

    const rows = clicks.map(click => {
      const date = new Date(click.created_at);
      return [
        date.toISOString().split('T')[0],
        date.toTimeString().split(' ')[0],
        click.links?.label || '',
        click.links?.slug || '',
        click.links?.url || '',
        click.device || '',
        click.browser || '',
        click.country || '',
        click.city || '',
        click.region || '',
        click.utm_source || '',
        click.utm_medium || '',
        click.utm_campaign || '',
        click.utm_content || '',
        click.utm_term || '',
        click.referer || '',
        click.ip_address || '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="kliktrack-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
