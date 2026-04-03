import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { headers } from 'next/headers';

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
    const text = `🔔 *Klik Baru!*\n📎 *Link:* ${link.label}\n🌍 *Negara:* ${clickData.country || 'Unknown'}\n📱 *Device:* ${clickData.device}\n🌐 *Browser:* ${clickData.browser}`;
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
  } catch (e) {
    console.error('Telegram notification failed:', e);
  }
}

export default async function RedirectPage({ params, searchParams }) {
  const { slug } = params;

  const { data: link, error } = await supabase
    .from('links')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !link) {
    redirect('/dashboard');
  }

  const headersList = headers();
  const userAgent = headersList.get('user-agent') || '';
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const referer = headersList.get('referer') || '';

  // Geo-IP from Vercel
  const country = headersList.get('x-vercel-ip-country') || null;
  const city = headersList.get('x-vercel-ip-city') || null;
  const region = headersList.get('x-vercel-ip-country-region') || null;

  let device = 'desktop';
  if (/mobile|android|iphone|ipod/i.test(userAgent)) device = 'mobile';
  else if (/tablet|ipad/i.test(userAgent)) device = 'tablet';

  let browser = 'other';
  if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) browser = 'chrome';
  else if (/firefox/i.test(userAgent)) browser = 'firefox';
  else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'safari';
  else if (/edge/i.test(userAgent)) browser = 'edge';

  // UTM params
  const utm_source = searchParams?.utm_source || null;
  const utm_medium = searchParams?.utm_medium || null;
  const utm_campaign = searchParams?.utm_campaign || null;
  const utm_content = searchParams?.utm_content || null;
  const utm_term = searchParams?.utm_term || null;

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

  await supabase.from('clicks').insert(clickData);

  // Notifications
  const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
  const telegramBot = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChat = process.env.TELEGRAM_CHAT_ID;

  notifyDiscord(discordWebhook, link, clickData);
  notifyTelegram(telegramBot, telegramChat, link, clickData);

  redirect(link.url);
}
