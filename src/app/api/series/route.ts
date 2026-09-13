import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Series from '@/models/Series';
import Channel from '@/models/Channel';
import { getCurrentUser } from '@/lib/auth';

// GET /api/series — list series with optional channel/status filtering
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const channelId = searchParams.get('channelId');
    const status = searchParams.get('status');

    await dbConnect();

    const filter: Record<string, unknown> = { userId: user.userId };
    if (channelId) filter.channelId = channelId;
    if (status) filter.status = status;

    const series = await Series.find(filter)
      .populate('channelId', 'name genre slug')
      .sort({ updatedAt: -1 })
      .lean();

    return Response.json({ series });
  } catch (error) {
    console.error('List series error:', error);
    return Response.json({ error: 'Failed to load series' }, { status: 500 });
  }
}

// POST /api/series — create manual series
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.title || !body.channelId) {
      return Response.json({ error: 'Title and Channel are required' }, { status: 400 });
    }

    await dbConnect();

    // Verify channel belongs to user
    const channel = await Channel.findOne({ _id: body.channelId, userId: user.userId });
    if (!channel) {
      return Response.json({ error: 'Channel not found' }, { status: 404 });
    }

    const series = await Series.create({
      ...body,
      userId: user.userId,
      genre: body.genre || channel.genre,
    });

    return Response.json({ series }, { status: 201 });
  } catch (error) {
    console.error('Create series error:', error);
    return Response.json({ error: 'Failed to create series' }, { status: 500 });
  }
}
