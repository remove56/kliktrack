import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Send Discord notification
async function notifyDiscord(webhookUrl, link, clickData) {
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: '🔔 Klik Baru!',
          color: 0x6366f1,
          fields: [
            { name: 'Link', value: link.label, inline: true },
            { name: 'Device', value: clickData.device, inline: true },
            { name: 'Negara', value: clickData.country || 'Unknown', inline: true },
            { name: 'Browser', value: clickData.browser, inline: true },
            { name: 'UTM Source', value: clickData.utm_source || '-', inline: true },
            { name: 'Referer', value: clickData.referer?.substring(0, 100) || '-', inline: true },
          ],
          timestamp: new Date().toISOString(),
        }],
      }),
    });
  } catch (e) {
    console.error('Discord notification failed:', e);
  }
}

// Send Telegram notification
async function notifyTelegram(botToken, chatId, link, clickData) {
  if (!botToken || !chatId) return;
  try {
    const text = `🔔 *Klik Baru!*\n\n` +
      `📎 *Link:* ${link.label}\n` +
      `🌍 *Negara:* ${clickData.country || 'Unknown'}\n` +
      `📱 *Device:* ${clickData.device}\n` +
      `🌐 *Browser:* ${clickData.browser}\n` +
      `📊 *UTM Source:* ${clickData.utm_source || '-'}\n` +
      `🔗 *UTM Medium:* ${clickData.utm_medium || '-'}`;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });
  } catch (e) {
    console.error('Telegram notification failed:', e);
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Slug required' }, { status: 400 });
    }

    const { data: link, error: linkError } = await supabase
      .from('links')
      .select('*')
      .eq('slug', slug)
      .single();

    if (linkError || !link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Parse headers
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') || 'unknown';
    const referer = request.headers.get('referer') || '';

    // Geo-IP from Vercel headers (free, automatic)
    const country = request.headers.get('x-vercel-ip-country') || null;
    const city = request.headers.get('x-vercel-ip-city') || null;
    const region = request.headers.get('x-vercel-ip-country-region') || null;

    // Device detection
    let device = 'desktop';
    if (/mobile|android|iphone|ipod/i.test(userAgent)) device = 'mobile';
    else if (/tablet|ipad/i.test(userAgent)) device = 'tablet';

    // Browser detection
    let browser = 'other';
    if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) browser = 'chrome';
    else if (/firefox/i.test(userAgent)) browser = 'firefox';
    else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'safari';
    else if (/edge/i.test(userAgent)) browser = 'edge';

    // UTM parameter tracking
    const utm_source = searchParams.get('utm_source') || null;
    const utm_medium = searchParams.get('utm_medium') || null;
    const utm_campaign = searchParams.get('utm_campaign') || null;
    const utm_content = searchParams.get('utm_content') || null;
    const utm_term = searchParams.get('utm_term') || null;

    // Build click data
    const clickData = {
      link_id: link.id,
      ip_address: ip,
      user_agent: userAgent.substring(0, 500),
      referer: referer.substring(0, 500),
      device,
      browser,
      country,
      city,
      region,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
    };

    // Log the click
    await supabase.from('clicks').insert(clickData);

    // Send notifications (non-blocking)
    const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
    const telegramBot = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChat = process.env.TELEGRAM_CHAT_ID;

    notifyDiscord(discordWebhook, link, clickData);
    notifyTelegram(telegramBot, telegramChat, link, clickData);

    // Redirect to actual URL
    return NextResponse.redirect(link.url, { status: 302 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
