import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Series from '@/models/Series';
import Episode from '@/models/Episode';
import { getCurrentUser } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/series/[id]
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    await dbConnect();

    const series = await Series.findOne({ _id: id, userId: user.userId })
      .populate('channelId', 'name genre slug channelDNA')
      .lean();

    if (!series) {
      return Response.json({ error: 'Series not found' }, { status: 404 });
    }

    // Load episodes belonging to this series
    const episodes = await Episode.find({ seriesId: id, userId: user.userId })
      .sort({ episodeNumber: 1 })
      .lean();

    return Response.json({ series, episodes });
  } catch (error) {
    console.error('Get series error:', error);
    return Response.json({ error: 'Failed to load series' }, { status: 500 });
  }
}

// PUT /api/series/[id]
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    await dbConnect();

    const series = await Series.findOneAndUpdate(
      { _id: id, userId: user.userId },
      { $set: body },
      { new: true, runValidators: true }
    ).populate('channelId', 'name genre slug');

    if (!series) {
      return Response.json({ error: 'Series not found' }, { status: 404 });
    }

    return Response.json({ series });
  } catch (error) {
    console.error('Update series error:', error);
    return Response.json({ error: 'Failed to update series' }, { status: 500 });
  }
}

// DELETE /api/series/[id]
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    await dbConnect();

    const result = await Series.findOneAndDelete({ _id: id, userId: user.userId });
    if (!result) {
      return Response.json({ error: 'Series not found' }, { status: 404 });
    }

    return Response.json({ message: 'Series deleted successfully' });
  } catch (error) {
    console.error('Delete series error:', error);
    return Response.json({ error: 'Failed to delete series' }, { status: 500 });
  }
}
