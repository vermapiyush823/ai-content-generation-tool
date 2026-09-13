import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Channel from '@/models/Channel';
import ContentIdea from '@/models/ContentIdea';
import Series from '@/models/Series';
import Episode from '@/models/Episode';
import Scene from '@/models/Scene';
import ContentPerformance from '@/models/ContentPerformance';
import Insight from '@/models/Insight';
import DailyContentPackage from '@/models/DailyContentPackage';
import EmailJob from '@/models/EmailJob';
import Settings from '@/models/Settings';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const [
      channelsCount,
      ideasCount,
      seriesCount,
      episodesCount,
      scenesCount,
      performanceData,
      topInsights,
      recentEpisodes,
      recentPackage,
      lastEmailJob,
      settings,
    ] = await Promise.all([
      Channel.countDocuments({ userId: user.userId, active: true }),
      ContentIdea.countDocuments({ userId: user.userId }),
      Series.countDocuments({ userId: user.userId }),
      Episode.countDocuments({ userId: user.userId }),
      Scene.countDocuments({ userId: user.userId }),
      ContentPerformance.find({ userId: user.userId }).lean(),
      Insight.find({ userId: user.userId, active: true }).sort({ createdAt: -1 }).limit(3).lean(),
      Episode.find({ userId: user.userId })
        .populate('channelId', 'name genre')
        .populate('seriesId', 'title')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      DailyContentPackage.findOne({ userId: user.userId })
        .populate('channelId', 'name genre')
        .sort({ date: -1 })
        .lean(),
      EmailJob.findOne({ userId: user.userId }).sort({ createdAt: -1 }).lean(),
      Settings.findOne({ userId: user.userId }).lean(),
    ]);

    // Calculate metrics
    const totalViews = performanceData.reduce((acc, p) => acc + (p.views || 0), 0);
    const avgViews = performanceData.length > 0 ? Math.round(totalViews / performanceData.length) : 0;

    // Find best performing channel
    const channelViewsMap: Record<string, { name: string; views: number }> = {};
    for (const p of performanceData) {
      const chId = p.channelId.toString();
      if (!channelViewsMap[chId]) {
        channelViewsMap[chId] = { name: '', views: 0 };
      }
      channelViewsMap[chId].views += p.views || 0;
    }

    let bestChannelName = 'None';
    let maxViews = -1;
    for (const chId in channelViewsMap) {
      if (channelViewsMap[chId].views > maxViews) {
        maxViews = channelViewsMap[chId].views;
      }
    }

    if (maxViews > 0) {
      const topCh = await Channel.findById(Object.keys(channelViewsMap)[0]).select('name').lean();
      if (topCh) bestChannelName = topCh.name;
    } else {
      const anyChannel = await Channel.findOne({ userId: user.userId, active: true }).select('name').lean();
      if (anyChannel) bestChannelName = anyChannel.name;
    }

    return Response.json({
      channels: channelsCount,
      ideas: ideasCount,
      series: seriesCount,
      episodes: episodesCount,
      prompts: scenesCount,
      avgViews,
      bestChannel: bestChannelName,
      recentEpisodes,
      recentPackage,
      topInsights,
      lastEmailJob,
      nextEmailSchedule: settings?.emailSettings?.time
        ? `${settings.emailSettings.time} ${settings.emailSettings.timezone}`
        : '08:00 UTC',
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return Response.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
