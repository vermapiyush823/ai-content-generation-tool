import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import ContentPerformance from '@/models/ContentPerformance';
import { getCurrentUser } from '@/lib/auth';

// GET /api/performance — list metrics and aggregations
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const channelId = searchParams.get('channelId');

    await dbConnect();

    const filter: Record<string, unknown> = { userId: user.userId };
    if (channelId) filter.channelId = channelId;

    const metrics = await ContentPerformance.find(filter)
      .populate('channelId', 'name genre slug')
      .populate('episodeId', 'title episodeNumber')
      .sort({ publishDate: -1 })
      .limit(100)
      .lean();

    // Summary calculations
    const totalViews = metrics.reduce((acc, m) => acc + (m.views || 0), 0);
    const totalLikes = metrics.reduce((acc, m) => acc + (m.likes || 0), 0);
    const totalShares = metrics.reduce((acc, m) => acc + (m.shares || 0), 0);
    const avgCompletion =
      metrics.length > 0
        ? Math.round(
            metrics.reduce((acc, m) => acc + (m.completionRate || m.averagePercentageViewed || 0), 0) /
              metrics.length
          )
        : 0;

    return Response.json({
      metrics,
      summary: {
        totalEntries: metrics.length,
        totalViews,
        totalLikes,
        totalShares,
        avgCompletion,
      },
    });
  } catch (error) {
    console.error('List performance error:', error);
    return Response.json({ error: 'Failed to load performance metrics' }, { status: 500 });
  }
}

// POST /api/performance — enter new performance metrics
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.title || !body.channelId) {
      return Response.json({ error: 'Video title and Channel are required' }, { status: 400 });
    }

    await dbConnect();

    const entry = await ContentPerformance.create({
      ...body,
      userId: user.userId,
    });

    return Response.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('Create performance error:', error);
    return Response.json({ error: 'Failed to record performance' }, { status: 500 });
  }
}
