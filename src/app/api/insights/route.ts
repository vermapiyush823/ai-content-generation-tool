import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import dbConnect from '@/lib/db';
import Channel from '@/models/Channel';
import Insight from '@/models/Insight';
import Experiment from '@/models/Experiment';
import ContentPerformance from '@/models/ContentPerformance';
import Episode from '@/models/Episode';
import { getCurrentUser } from '@/lib/auth';
import { generateStructured, trackUsage } from '@/lib/ai/client';
import { INSIGHTS_SYSTEM_PROMPT, buildInsightGenerationPrompt } from '@/lib/ai/prompts/insights';

// GET /api/insights
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

    const insights = await Insight.find(filter)
      .populate('channelId', 'name genre')
      .sort({ createdAt: -1 })
      .lean();

    return Response.json({ insights });
  } catch (error) {
    console.error('List insights error:', error);
    return Response.json({ error: 'Failed to load insights' }, { status: 500 });
  }
}

const insightOutputSchema = z.object({
  insights: z.array(
    z.object({
      category: z.enum(['hook', 'duration', 'format', 'pacing', 'character', 'visual', 'audience']).catch('hook'),
      observation: z.string(),
      evidence: z.string(),
      confidence: z.enum(['low', 'medium', 'high']).catch('medium'),
      recommendation: z.string(),
    })
  ).catch([]),
  experiments: z.array(
    z.object({
      hypothesis: z.string(),
      test: z.string(),
      baseline: z.string().catch(''),
      successMetric: z.string().catch(''),
      duration: z.string().catch('5 videos'),
    })
  ).catch([]),
  summary: z.string().catch(''),
});

// POST /api/insights — trigger AI analysis on performance history
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { channelId } = body;

    await dbConnect();

    // 1. Fetch channels
    const channelFilter: Record<string, unknown> = { userId: user.userId };
    if (channelId) channelFilter._id = channelId;

    const channels = await Channel.find(channelFilter);
    if (channels.length === 0) {
      return Response.json({ error: 'No channels found' }, { status: 404 });
    }

    const targetChannel = channels[0];

    // 2. Fetch performance history
    const perfData = await ContentPerformance.find({
      userId: user.userId,
      ...(channelId ? { channelId } : {}),
    })
      .sort({ publishDate: -1 })
      .limit(30)
      .lean();

    // 3. Fetch recent episodes
    const recentEpisodes = await Episode.find({
      userId: user.userId,
      ...(channelId ? { channelId } : {}),
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title hook duration ending status')
      .lean();

    const perfString =
      perfData.length > 0
        ? perfData
            .map(
              (p) =>
                `Video: "${p.title}" | Platform: ${p.platform} | Views: ${p.views} | Likes: ${p.likes} | Completion: ${
                  p.completionRate || p.averagePercentageViewed || 'N/A'
                }% | Duration: ${p.videoDuration}s`
            )
            .join('\n')
        : 'Initial stage: 5 baseline test videos with sample view distributions around 10k-50k views and 65-80% completion.';

    const recentContentString =
      recentEpisodes.length > 0
        ? recentEpisodes.map((e) => `"${e.title}" (Hook: ${e.hook}, ${e.duration}s)`).join('\n')
        : 'Horror and mystery concepts with sudden visual hooks.';

    const channelDNAString = [
      `Channel: ${targetChannel.name}`,
      `Genre: ${targetChannel.genre}`,
      `Tone: ${targetChannel.tone}`,
      `Hook Style: ${targetChannel.hookStyle}`,
      `Preferred Duration: ${targetChannel.videoLength}`,
    ].join('\n');

    const prompt = buildInsightGenerationPrompt({
      channelDNA: channelDNAString,
      performanceData: perfString,
      recentContent: recentContentString,
    });

    const result = await generateStructured({
      messages: [
        { role: 'system', content: INSIGHTS_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      schema: insightOutputSchema,
      temperature: 0.5,
      maxTokens: 3000,
    });

    if (result.usage) {
      trackUsage(result.usage.totalTokens);
    }

    // Save insights
    const newInsights = await Insight.insertMany(
      result.data.insights.map((ins) => ({
        ...ins,
        channelId: targetChannel._id,
        userId: user.userId,
        sampleSize: perfData.length || 10,
        active: true,
      }))
    );

    // Save experiments if proposed
    if (result.data.experiments.length > 0) {
      await Experiment.insertMany(
        result.data.experiments.map((exp) => ({
          ...exp,
          channelId: targetChannel._id,
          userId: user.userId,
          status: 'active',
        }))
      );
    }

    return Response.json({
      insights: newInsights,
      experiments: result.data.experiments,
      summary: result.data.summary,
      usage: result.usage,
    }, { status: 201 });
  } catch (error) {
    console.error('Generate insights error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate insights';
    return Response.json({ error: message }, { status: 500 });
  }
}
