import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import dbConnect from '@/lib/db';
import Channel from '@/models/Channel';
import ContentIdea from '@/models/ContentIdea';
import { getCurrentUser } from '@/lib/auth';
import { generateStructured, trackUsage } from '@/lib/ai/client';
import { IDEA_SYSTEM_PROMPT, buildIdeaGenerationPrompt } from '@/lib/ai/prompts/idea';

const generateSchema = z.object({
  channelId: z.string().min(1, 'Channel ID is required'),
  count: z.number().min(1).max(10).default(5),
});

const ideaSchema = z.object({
  title: z.string(),
  concept: z.string(),
  hook: z.string(),
  genre: z.string(),
  format: z.enum(['standalone', 'series_potential', 'sequel']).catch('standalone'),
  seriesPotential: z.boolean().catch(false),
  visualPotential: z.number().min(1).max(10).catch(5),
  noveltyScore: z.number().min(1).max(10).catch(5),
  retentionPotential: z.number().min(1).max(10).catch(5),
  productionDifficulty: z.number().min(1).max(10).catch(5),
  overallScore: z.number().min(1).max(10).catch(5),
  reasoning: z.string().catch(''),
});

const ideasArraySchema = z.array(ideaSchema);

// POST /api/ideas/generate — generate ideas using NVIDIA AI
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { channelId, count } = parsed.data;

    await dbConnect();

    // Load channel
    const channel = await Channel.findOne({ _id: channelId, userId: user.userId });
    if (!channel) {
      return Response.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Build channel DNA context string
    const dna = channel.channelDNA;
    const channelDNAString = [
      `Channel: ${channel.name}`,
      `Genre: ${channel.genre}${channel.subgenre ? ` / ${channel.subgenre}` : ''}`,
      `Tone: ${channel.tone}`,
      `Audience: ${channel.audience}`,
      `Visual Style: ${channel.visualStyle}`,
      `Narration: ${channel.narrationStyle}`,
      `Hook Style: ${channel.hookStyle}`,
      `Video Length: ${channel.videoLength}`,
      dna?.identity ? `Identity: ${dna.identity}` : '',
      dna?.contentPillars?.length ? `Content Pillars: ${dna.contentPillars.join(', ')}` : '',
      channel.forbiddenTopics?.length ? `FORBIDDEN: ${channel.forbiddenTopics.join(', ')}` : '',
      channel.contentRules?.length ? `Rules: ${channel.contentRules.join('; ')}` : '',
    ].filter(Boolean).join('\n');

    // Load recent ideas to avoid repetition
    const recentIdeas = await ContentIdea.find({ channelId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title')
      .lean();

    const prompt = buildIdeaGenerationPrompt({
      channelDNA: channelDNAString,
      recentIdeas: recentIdeas.map((i) => i.title),
      count,
      genre: channel.genre,
      language: channel.language,
    });

    // Call NVIDIA AI
    const result = await generateStructured({
      messages: [
        { role: 'system', content: IDEA_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      schema: ideasArraySchema,
      temperature: 0.8,
      maxTokens: 4096,
    });

    // Track usage
    if (result.usage) {
      trackUsage(result.usage.totalTokens);
    }

    // Save ideas to database
    const savedIdeas = await ContentIdea.insertMany(
      result.data.map((idea) => ({
        ...idea,
        channelId,
        userId: user.userId,
        status: 'draft',
      }))
    );

    return Response.json({
      ideas: savedIdeas,
      generated: savedIdeas.length,
      usage: result.usage,
    });
  } catch (error) {
    console.error('Generate ideas error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate ideas';
    return Response.json({ error: message }, { status: 500 });
  }
}
