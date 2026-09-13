import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import ContentIdea from '@/models/ContentIdea';
import { getCurrentUser } from '@/lib/auth';

// PUT /api/ideas/[id] — update idea (status, fields)
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

    const idea = await ContentIdea.findOneAndUpdate(
      { _id: id, userId: user.userId },
      { $set: body },
      { new: true }
    ).lean();

    if (!idea) {
      return Response.json({ error: 'Idea not found' }, { status: 404 });
    }

    return Response.json({ idea });
  } catch (error) {
    console.error('Update idea error:', error);
    return Response.json({ error: 'Failed to update idea' }, { status: 500 });
  }
}

// DELETE /api/ideas/[id]
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

    const idea = await ContentIdea.findOneAndDelete({ _id: id, userId: user.userId });
    if (!idea) {
      return Response.json({ error: 'Idea not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Delete idea error:', error);
    return Response.json({ error: 'Failed to delete idea' }, { status: 500 });
  }
}
