import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { headers } from 'next/headers';

export default async function RedirectPage({ params }) {
  const { slug } = params;

  // Find the link
  const { data: link, error } = await supabase
    .from('links')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !link) {
    redirect('/dashboard');
  }

  // Get request info
  const headersList = headers();
  const userAgent = headersList.get('user-agent') || '';
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const referer = headersList.get('referer') || '';

  // Determine device
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
  });

  // Redirect
  redirect(link.url);
}
