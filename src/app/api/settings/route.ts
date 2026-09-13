import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';
import { getCurrentUser } from '@/lib/auth';

// GET /api/settings
export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    let settings = await Settings.findOne({ userId: user.userId }).lean();
    if (!settings) {
      settings = await Settings.create({
        userId: user.userId,
        emailSettings: {
          enabled: true,
          recipientEmail: user.email,
          time: '08:00',
          timezone: 'UTC',
          videosPerChannel: 2,
          includeInsights: true,
          includeScripts: true,
          includePrompts: true,
          includeCaptions: true,
        },
      });
    }

    return Response.json({
      settings,
      system: {
        aiBrain: process.env.NVIDIA_MODEL || 'meta/llama-3.1-70b-instruct',
        hasResend: !!process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('placeholder'),
        hasNvidia: !!process.env.NVIDIA_API_KEY && !process.env.NVIDIA_API_KEY.includes('placeholder'),
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      },
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return Response.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

// PUT /api/settings
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    await dbConnect();

    const settings = await Settings.findOneAndUpdate(
      { userId: user.userId },
      { $set: body },
      { new: true, upsert: true }
    );

    return Response.json({ settings });
  } catch (error) {
    console.error('Update settings error:', error);
    return Response.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
