import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import ContentIdea from '@/models/ContentIdea';
import { getCurrentUser } from '@/lib/auth';

// GET /api/ideas — list ideas with optional filtering
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

    const ideas = await ContentIdea.find(filter)
      .sort({ overallScore: -1, createdAt: -1 })
      .limit(50)
      .lean();

    return Response.json({ ideas });
  } catch (error) {
    console.error('List ideas error:', error);
    return Response.json({ error: 'Failed to load ideas' }, { status: 500 });
  }
}

// POST /api/ideas — create a manual idea
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    await dbConnect();

    const idea = await ContentIdea.create({
      ...body,
      userId: user.userId,
    });

    return Response.json({ idea }, { status: 201 });
  } catch (error) {
    console.error('Create idea error:', error);
    return Response.json({ error: 'Failed to create idea' }, { status: 500 });
  }
}
