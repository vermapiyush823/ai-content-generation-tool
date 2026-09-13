import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Experiment from '@/models/Experiment';
import { getCurrentUser } from '@/lib/auth';

// GET /api/experiments
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

    const experiments = await Experiment.find(filter)
      .populate('channelId', 'name genre')
      .sort({ createdAt: -1 })
      .lean();

    return Response.json({ experiments });
  } catch (error) {
    console.error('List experiments error:', error);
    return Response.json({ error: 'Failed to load experiments' }, { status: 500 });
  }
}

// POST /api/experiments
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.hypothesis || !body.test) {
      return Response.json({ error: 'Hypothesis and test are required' }, { status: 400 });
    }

    await dbConnect();

    const experiment = await Experiment.create({
      ...body,
      userId: user.userId,
    });

    return Response.json({ experiment }, { status: 201 });
  } catch (error) {
    console.error('Create experiment error:', error);
    return Response.json({ error: 'Failed to create experiment' }, { status: 500 });
  }
}

// PUT /api/experiments (update status or outcome)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    await dbConnect();

    const experiment = await Experiment.findOneAndUpdate(
      { _id: id, userId: user.userId },
      { $set: updates },
      { new: true }
    );

    if (!experiment) {
      return Response.json({ error: 'Experiment not found' }, { status: 404 });
    }

    return Response.json({ experiment });
  } catch (error) {
    console.error('Update experiment error:', error);
    return Response.json({ error: 'Failed to update experiment' }, { status: 500 });
  }
}
