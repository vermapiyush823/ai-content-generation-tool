import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Episode from '@/models/Episode';
import Channel from '@/models/Channel';
import { getCurrentUser } from '@/lib/auth';

// GET /api/episodes — list episodes with optional filtering
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const channelId = searchParams.get('channelId');
    const seriesId = searchParams.get('seriesId');
    const status = searchParams.get('status');

    await dbConnect();

    const filter: Record<string, unknown> = { userId: user.userId };
    if (channelId) filter.channelId = channelId;
    if (seriesId) filter.seriesId = seriesId;
    if (status) filter.status = status;

    const episodes = await Episode.find(filter)
      .populate('channelId', 'name genre slug')
      .populate('seriesId', 'title status currentEpisode plannedEpisodes')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return Response.json({ episodes });
  } catch (error) {
    console.error('List episodes error:', error);
    return Response.json({ error: 'Failed to load episodes' }, { status: 500 });
  }
}

// POST /api/episodes — create manual episode
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.title || !body.channelId || !body.script) {
      return Response.json(
        { error: 'Title, Channel ID, and Script are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const channel = await Channel.findOne({ _id: body.channelId, userId: user.userId });
    if (!channel) {
      return Response.json({ error: 'Channel not found' }, { status: 404 });
    }

    const episode = await Episode.create({
      ...body,
      userId: user.userId,
    });

    return Response.json({ episode }, { status: 201 });
  } catch (error) {
    console.error('Create episode error:', error);
    return Response.json({ error: 'Failed to create episode' }, { status: 500 });
  }
}
