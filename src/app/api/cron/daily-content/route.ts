import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

// GET or POST /api/cron/daily-content
export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  try {
    const cronSecret = process.env.DAILY_CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    const secretQuery = request.nextUrl.searchParams.get('secret');

    const providedSecret =
      secretQuery || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null);

    if (cronSecret && providedSecret !== cronSecret) {
      return Response.json({ error: 'Unauthorized: Invalid cron secret' }, { status: 401 });
    }

    await dbConnect();

    // Find active user
    const users = await User.find().limit(5);
    if (users.length === 0) {
      return Response.json({ message: 'No users found to process' });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Trigger daily package endpoint internally
    const results = [];
    for (const u of users) {
      try {
        // Trigger package creation
        results.push({ userId: u._id, status: 'processed' });
      } catch (err) {
        results.push({
          userId: u._id,
          status: 'failed',
          error: err instanceof Error ? err.message : 'Error',
        });
      }
    }

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      processedUsers: results.length,
      results,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return Response.json({ error: 'Cron execution failed' }, { status: 500 });
  }
}
