import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import dbConnect from '@/lib/db';
import Channel from '@/models/Channel';
import { getCurrentUser } from '@/lib/auth';

// GET /api/channels/[id] — get a single channel
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const channel = await Channel.findOne({ _id: id, userId: user.userId }).lean();
    if (!channel) {
      return Response.json({ error: 'Channel not found' }, { status: 404 });
    }

    return Response.json({ channel });
  } catch (error) {
    console.error('Get channel error:', error);
    return Response.json({ error: 'Failed to load channel' }, { status: 500 });
  }
}

// PUT /api/channels/[id] — update a channel
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    await dbConnect();

    const channel = await Channel.findOneAndUpdate(
      { _id: id, userId: user.userId },
      { $set: body },
      { new: true, runValidators: true }
    ).lean();

    if (!channel) {
      return Response.json({ error: 'Channel not found' }, { status: 404 });
    }

    return Response.json({ channel });
  } catch (error) {
    console.error('Update channel error:', error);
    return Response.json({ error: 'Failed to update channel' }, { status: 500 });
  }
}

// DELETE /api/channels/[id] — delete a channel
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const channel = await Channel.findOneAndDelete({ _id: id, userId: user.userId });
    if (!channel) {
      return Response.json({ error: 'Channel not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Delete channel error:', error);
    return Response.json({ error: 'Failed to delete channel' }, { status: 500 });
  }
}
