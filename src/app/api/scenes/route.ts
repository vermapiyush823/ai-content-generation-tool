import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Scene from '@/models/Scene';
import { getCurrentUser } from '@/lib/auth';

// GET /api/scenes?episodeId=...
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const episodeId = searchParams.get('episodeId');
    if (!episodeId) {
      return Response.json({ error: 'episodeId query parameter is required' }, { status: 400 });
    }

    await dbConnect();

    const scenes = await Scene.find({ episodeId, userId: user.userId })
      .sort({ sceneNumber: 1 })
      .lean();

    return Response.json({ scenes });
  } catch (error) {
    console.error('List scenes error:', error);
    return Response.json({ error: 'Failed to load scenes' }, { status: 500 });
  }
}
