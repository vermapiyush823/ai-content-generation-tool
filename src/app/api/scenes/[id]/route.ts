import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Scene from '@/models/Scene';
import Episode from '@/models/Episode';
import { getCurrentUser } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/scenes/[id]
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    await dbConnect();

    const scene = await Scene.findOne({ _id: id, userId: user.userId }).lean();
    if (!scene) {
      return Response.json({ error: 'Scene not found' }, { status: 404 });
    }

    return Response.json({ scene });
  } catch (error) {
    console.error('Get scene error:', error);
    return Response.json({ error: 'Failed to load scene' }, { status: 500 });
  }
}

// PUT /api/scenes/[id] — update scene fields/prompts
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    await dbConnect();

    const scene = await Scene.findOneAndUpdate(
      { _id: id, userId: user.userId },
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!scene) {
      return Response.json({ error: 'Scene not found' }, { status: 404 });
    }

    return Response.json({ scene });
  } catch (error) {
    console.error('Update scene error:', error);
    return Response.json({ error: 'Failed to update scene' }, { status: 500 });
  }
}

// DELETE /api/scenes/[id]
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    await dbConnect();

    const scene = await Scene.findOneAndDelete({ _id: id, userId: user.userId });
    if (!scene) {
      return Response.json({ error: 'Scene not found' }, { status: 404 });
    }

    // Decrement episode sceneCount
    await Episode.findByIdAndUpdate(scene.episodeId, { $inc: { sceneCount: -1 } });

    return Response.json({ message: 'Scene deleted successfully' });
  } catch (error) {
    console.error('Delete scene error:', error);
    return Response.json({ error: 'Failed to delete scene' }, { status: 500 });
  }
}
