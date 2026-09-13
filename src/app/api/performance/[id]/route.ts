import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import ContentPerformance from '@/models/ContentPerformance';
import { getCurrentUser } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    await dbConnect();

    const res = await ContentPerformance.findOneAndDelete({ _id: id, userId: user.userId });
    if (!res) {
      return Response.json({ error: 'Record not found' }, { status: 404 });
    }

    return Response.json({ message: 'Performance record deleted' });
  } catch (error) {
    console.error('Delete performance error:', error);
    return Response.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}
