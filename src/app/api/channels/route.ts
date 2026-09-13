import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import dbConnect from '@/lib/db';
import Channel from '@/models/Channel';
import { getCurrentUser } from '@/lib/auth';

const createChannelSchema = z.object({
  name: z.string().min(2, 'Channel name must be at least 2 characters'),
  platforms: z.array(z.enum(['youtube_shorts', 'instagram_reels', 'tiktok'])).min(1),
  genre: z.string().min(1, 'Genre is required'),
  subgenre: z.string().optional(),
  language: z.string().default('English'),
  audience: z.string().optional(),
  ageRange: z.string().optional(),
  geography: z.string().optional(),
  tone: z.string().optional(),
  narrationStyle: z.string().optional(),
  visualStyle: z.string().optional(),
  videoLength: z.string().optional(),
  contentFrequency: z.string().optional(),
  seriesPreference: z.enum(['standalone', 'series', 'mixed']).optional(),
  hookStyle: z.string().optional(),
  endingStyle: z.string().optional(),
  ctaStyle: z.string().optional(),
  contentRules: z.array(z.string()).optional(),
  forbiddenTopics: z.array(z.string()).optional(),
});

// GET /api/channels — list all channels for the current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const channels = await Channel.find({ userId: user.userId })
      .sort({ createdAt: -1 })
      .lean();

    return Response.json({ channels });
  } catch (error) {
    console.error('List channels error:', error);
    return Response.json({ error: 'Failed to load channels' }, { status: 500 });
  }
}

// POST /api/channels — create a new channel
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createChannelSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    await dbConnect();

    // Generate slug from name
    const slug = parsed.data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check for duplicate slug
    const existing = await Channel.findOne({ slug, userId: user.userId });
    if (existing) {
      return Response.json(
        { error: 'A channel with a similar name already exists' },
        { status: 409 }
      );
    }

    const channel = await Channel.create({
      ...parsed.data,
      slug,
      userId: user.userId,
    });

    return Response.json({ channel }, { status: 201 });
  } catch (error) {
    console.error('Create channel error:', error);
    return Response.json({ error: 'Failed to create channel' }, { status: 500 });
  }
}
