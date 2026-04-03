import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    const since = new Date();
    since.setDate(since.getDate() - days);

    // Get all clicks within the time range
    const { data: clicks, error } = await supabase
      .from('clicks')
      .select('*')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Aggregate by day
    const dailyMap = {};
    const hourlyMap = {};
    const deviceMap = {};
    const browserMap = {};
    const countryMap = {};

    clicks?.forEach(click => {
      const date = new Date(click.created_at);
      const dayKey = date.toISOString().split('T')[0];
      const hourKey = date.getHours();

      dailyMap[dayKey] = (dailyMap[dayKey] || 0) + 1;
      hourlyMap[hourKey] = (hourlyMap[hourKey] || 0) + 1;
      deviceMap[click.device || 'unknown'] = (deviceMap[click.device || 'unknown'] || 0) + 1;
      browserMap[click.browser || 'unknown'] = (browserMap[click.browser || 'unknown'] || 0) + 1;
      countryMap[click.country || 'Unknown'] = (countryMap[click.country || 'Unknown'] || 0) + 1;
    });

    // Format daily data
    const daily = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      daily.push({
        day: dayNames[d.getDay()],
        date: key,
        clicks: dailyMap[key] || 0,
      });
    }

    // Format hourly data
    const hourly = Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, '0')}:00`,
      clicks: hourlyMap[i] || 0,
    }));

    // Format device data
    const devices = Object.entries(deviceMap).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      icon: name === 'mobile' ? '📱' : name === 'tablet' ? '📟' : '💻',
    }));

    // Format browser data
    const browsers = Object.entries(browserMap).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));

    // Format country data
    const countries = Object.entries(countryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Total stats
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
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
