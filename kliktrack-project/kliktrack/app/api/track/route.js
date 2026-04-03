import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/track?slug=xxx - Log a click and redirect
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Slug required' }, { status: 400 });
    }

    // Find the link
    const { data: link, error: linkError } = await supabase
      .from('links')
      .select('*')
      .eq('slug', slug)
      .single();

    if (linkError || !link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Parse user agent and headers
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') || 'unknown';
    const referer = request.headers.get('referer') || '';

    // Determine device type from user agent
    let device = 'desktop';
    if (/mobile|android|iphone|ipod/i.test(userAgent)) device = 'mobile';
    else if (/tablet|ipad/i.test(userAgent)) device = 'tablet';

    // Determine browser
    let browser = 'other';
    if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) browser = 'chrome';
    else if (/firefox/i.test(userAgent)) browser = 'firefox';
    else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'safari';
    else if (/edge/i.test(userAgent)) browser = 'edge';

    // Log the click
    await supabase.from('clicks').insert({
      link_id: link.id,
      ip_address: ip,
      user_agent: userAgent.substring(0, 500),
      referer: referer.substring(0, 500),
      device,
      browser,
      country: null, // Will be enriched by geo lookup if needed
    });

    // Redirect to actual URL
    return NextResponse.redirect(link.url, { status: 302 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
