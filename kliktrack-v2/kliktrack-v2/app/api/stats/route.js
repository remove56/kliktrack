import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data: clicks, error } = await supabase
      .from('clicks')
      .select('*')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    const dailyMap = {};
    const hourlyMap = {};
    const deviceMap = {};
    const browserMap = {};
    const countryMap = {};
    const cityMap = {};
    const utmSourceMap = {};
    const utmMediumMap = {};
    const utmCampaignMap = {};

    clicks?.forEach(click => {
      const date = new Date(click.created_at);
      const dayKey = date.toISOString().split('T')[0];
      const hourKey = date.getHours();

      dailyMap[dayKey] = (dailyMap[dayKey] || 0) + 1;
      hourlyMap[hourKey] = (hourlyMap[hourKey] || 0) + 1;
      deviceMap[click.device || 'unknown'] = (deviceMap[click.device || 'unknown'] || 0) + 1;
      browserMap[click.browser || 'unknown'] = (browserMap[click.browser || 'unknown'] || 0) + 1;

      // Country mapping with code to name
      const countryName = getCountryName(click.country) || click.country || 'Unknown';
      countryMap[countryName] = (countryMap[countryName] || 0) + 1;

      if (click.city) {
        cityMap[click.city] = (cityMap[click.city] || 0) + 1;
      }

      // UTM tracking
      if (click.utm_source) {
        utmSourceMap[click.utm_source] = (utmSourceMap[click.utm_source] || 0) + 1;
      }
      if (click.utm_medium) {
        utmMediumMap[click.utm_medium] = (utmMediumMap[click.utm_medium] || 0) + 1;
      }
      if (click.utm_campaign) {
        utmCampaignMap[click.utm_campaign] = (utmCampaignMap[click.utm_campaign] || 0) + 1;
      }
    });

    // Format daily
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const daily = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      daily.push({ day: dayNames[d.getDay()], date: key, clicks: dailyMap[key] || 0 });
    }

    // Format hourly
    const hourly = Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, '0')}:00`,
      clicks: hourlyMap[i] || 0,
    }));

    // Format device
    const devices = Object.entries(deviceMap).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      icon: name === 'mobile' ? '📱' : name === 'tablet' ? '📟' : '💻',
    }));

    // Format browser
    const browsers = Object.entries(browserMap).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));

    // Format countries
    const countries = Object.entries(countryMap)
      .map(([name, value]) => ({ name, value, flag: getCountryFlag(name) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Format cities
    const cities = Object.entries(cityMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Format UTM data
    const utmSources = Object.entries(utmSourceMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const utmMediums = Object.entries(utmMediumMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const utmCampaigns = Object.entries(utmCampaignMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const totalClicks = clicks?.length || 0;
    const today = new Date().toISOString().split('T')[0];
    const todayClicks = dailyMap[today] || 0;
    const avgClicks = days > 0 ? Math.round(totalClicks / days) : 0;

    return NextResponse.json({
      totalClicks,
      todayClicks,
      avgClicks,
      daily,
      hourly,
      devices,
      browsers,
      countries,
      cities,
      utmSources,
      utmMediums,
      utmCampaigns,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Country code to name mapping
function getCountryName(code) {
  if (!code) return null;
  const map = {
    ID: 'Indonesia', MY: 'Malaysia', SG: 'Singapura', PH: 'Filipina',
    TH: 'Thailand', VN: 'Vietnam', US: 'Amerika Serikat', GB: 'Inggris',
    AU: 'Australia', JP: 'Jepang', KR: 'Korea Selatan', IN: 'India',
    CN: 'China', DE: 'Jerman', FR: 'Prancis', BR: 'Brasil',
    CA: 'Kanada', NL: 'Belanda', RU: 'Rusia', SA: 'Arab Saudi',
    AE: 'UAE', HK: 'Hong Kong', TW: 'Taiwan', NZ: 'Selandia Baru',
    BD: 'Bangladesh', PK: 'Pakistan', MM: 'Myanmar', KH: 'Kamboja',
    LA: 'Laos', BN: 'Brunei', TL: 'Timor Leste',
  };
  return map[code] || code;
}

function getCountryFlag(name) {
  const flags = {
    'Indonesia': '🇮🇩', 'Malaysia': '🇲🇾', 'Singapura': '🇸🇬', 'Filipina': '🇵🇭',
    'Thailand': '🇹🇭', 'Vietnam': '🇻🇳', 'Amerika Serikat': '🇺🇸', 'Inggris': '🇬🇧',
    'Australia': '🇦🇺', 'Jepang': '🇯🇵', 'Korea Selatan': '🇰🇷', 'India': '🇮🇳',
    'China': '🇨🇳', 'Jerman': '🇩🇪', 'Prancis': '🇫🇷', 'Brasil': '🇧🇷',
    'Kanada': '🇨🇦', 'Belanda': '🇳🇱', 'Arab Saudi': '🇸🇦', 'UAE': '🇦🇪',
  };
  return flags[name] || '🌍';
}
