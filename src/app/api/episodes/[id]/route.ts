import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Episode from '@/models/Episode';
import Scene from '@/models/Scene';
import { getCurrentUser } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/episodes/[id] — get episode and its scenes
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    await dbConnect();

    const episode = await Episode.findOne({ _id: id, userId: user.userId })
      .populate('channelId', 'name genre visualStyle narrationStyle language')
      .populate('seriesId', 'title characters locations seriesBible')
      .lean();

    if (!episode) {
      return Response.json({ error: 'Episode not found' }, { status: 404 });
    }

    // Load scenes
    const scenes = await Scene.find({ episodeId: id })
      .sort({ sceneNumber: 1 })
      .lean();

    return Response.json({ episode, scenes });
  } catch (error) {
    console.error('Get episode error:', error);
    return Response.json({ error: 'Failed to load episode' }, { status: 500 });
  }
}

// PUT /api/episodes/[id] — update episode
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    await dbConnect();

    const episode = await Episode.findOneAndUpdate(
      { _id: id, userId: user.userId },
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!episode) {
      return Response.json({ error: 'Episode not found' }, { status: 404 });
    }

    return Response.json({ episode });
  } catch (error) {
    console.error('Update episode error:', error);
    return Response.json({ error: 'Failed to update episode' }, { status: 500 });
  }
}

// DELETE /api/episodes/[id] — delete episode and related scenes
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    await dbConnect();

    const episode = await Episode.findOneAndDelete({ _id: id, userId: user.userId });
    if (!episode) {
      return Response.json({ error: 'Episode not found' }, { status: 404 });
    }

    // Cascade delete scenes
    await Scene.deleteMany({ episodeId: id });

    return Response.json({ message: 'Episode and associated scenes deleted successfully' });
  } catch (error) {
    console.error('Delete episode error:', error);
    return Response.json({ error: 'Failed to delete episode' }, { status: 500 });
  }
}
