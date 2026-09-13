import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import dbConnect from '@/lib/db';
import Channel from '@/models/Channel';
import Series from '@/models/Series';
import ContentIdea from '@/models/ContentIdea';
import { getCurrentUser } from '@/lib/auth';
import { generateStructured, trackUsage } from '@/lib/ai/client';
import { SERIES_SYSTEM_PROMPT, buildSeriesCreationPrompt } from '@/lib/ai/prompts/series';

const generateSeriesSchema = z.object({
  channelId: z.string().min(1, 'Channel ID is required'),
  ideaId: z.string().optional(),
  title: z.string().optional(),
  concept: z.string().optional(),
  plannedEpisodes: z.number().min(2).max(12).default(5),
});

const seriesBibleOutputSchema = z.object({
  title: z.string(),
  concept: z.string(),
  premise: z.string().catch(''),
  theme: z.string().catch(''),
  plannedEpisodes: z.number().catch(5),
  seriesBible: z.object({
    worldRules: z.array(z.string()).catch([]),
    storyArc: z.string().catch(''),
    timeline: z.string().catch(''),
    episodeOutlines: z.array(
      z.object({
        episodeNumber: z.number(),
        title: z.string(),
        summary: z.string().catch(''),
        keyEvents: z.array(z.string()).catch([]),
        cliffhanger: z.string().catch(''),
      })
    ).catch([]),
    openThreads: z.array(z.string()).catch([]),
  }).catch({
    worldRules: [],
    storyArc: '',
    timeline: '',
    episodeOutlines: [],
    openThreads: [],
  }),
  characters: z.array(
    z.object({
      name: z.string(),
      age: z.string().catch(''),
      appearance: z.string().catch('Distinctive cinematic appearance'),
      clothing: z.string().catch(''),
      personality: z.string().catch(''),
      role: z.enum(['protagonist', 'antagonist', 'supporting', 'narrator']).catch('protagonist'),
      relationships: z.array(z.string()).catch([]),
      visualIdentity: z.string().catch('Consistent visual markers'),
    })
  ).catch([]),
  locations: z.array(
    z.object({
      name: z.string(),
      description: z.string().catch(''),
      visualIdentity: z.string().catch('Atmospheric setting'),
      importantDetails: z.array(z.string()).catch([]),
    })
  ).catch([]),
});

// POST /api/series/generate
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = generateSeriesSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { channelId, ideaId, title, concept, plannedEpisodes } = parsed.data;

    await dbConnect();

    // Verify channel
    const channel = await Channel.findOne({ _id: channelId, userId: user.userId });
    if (!channel) {
      return Response.json({ error: 'Channel not found' }, { status: 404 });
    }

    let ideaTitle = title || '';
    let ideaConcept = concept || '';

    // If ideaId provided, fetch idea
    if (ideaId) {
      const idea = await ContentIdea.findOne({ _id: ideaId, channelId });
      if (idea) {
        ideaTitle = idea.title;
        ideaConcept = idea.concept;
      }
    }

    if (!ideaTitle) {
      ideaTitle = `${channel.genre} Chronicles`;
      ideaConcept = `A high-stakes short-form serialized story exploring mystery and tension in ${channel.name}.`;
    }

    // Channel DNA context
    const channelDNAString = [
      `Channel: ${channel.name}`,
      `Genre: ${channel.genre}`,
      `Tone: ${channel.tone}`,
      `Audience: ${channel.audience}`,
      `Visual Style: ${channel.visualStyle}`,
      `Narration: ${channel.narrationStyle}`,
      `Hook Style: ${channel.hookStyle}`,
      `Ending Style: ${channel.endingStyle}`,
    ].join('\n');

    const prompt = buildSeriesCreationPrompt({
      channelDNA: channelDNAString,
      ideaTitle,
      ideaConcept,
      plannedEpisodes,
      genre: channel.genre,
      language: channel.language,
    });

    const result = await generateStructured({
      messages: [
        { role: 'system', content: SERIES_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      schema: seriesBibleOutputSchema,
      temperature: 0.7,
      maxTokens: 4096,
    });

    if (result.usage) {
      trackUsage(result.usage.totalTokens);
    }

    const seriesData = result.data;

    // Save series to database
    const newSeries = await Series.create({
      title: seriesData.title,
      concept: seriesData.concept,
      genre: channel.genre,
      premise: seriesData.premise,
      theme: seriesData.theme,
      plannedEpisodes: seriesData.plannedEpisodes || plannedEpisodes,
      currentEpisode: 1,
      status: 'active',
      seriesBible: {
        worldRules: seriesData.seriesBible.worldRules,
        timeline: seriesData.seriesBible.timeline,
        storyArc: seriesData.seriesBible.storyArc,
        episodeOutlines: seriesData.seriesBible.episodeOutlines,
        storyState: {
          whatHasHappened: [],
          currentMystery: seriesData.concept,
          knownInformation: [],
          unknownInformation: [],
          openThreads: seriesData.seriesBible.openThreads,
          resolvedThreads: [],
          futureClues: [],
        },
      },
      characters: seriesData.characters,
      locations: seriesData.locations,
      objects: [],
      channelId,
      userId: user.userId,
    });

    // If an idea was converted, update idea status
    if (ideaId) {
      await ContentIdea.findByIdAndUpdate(ideaId, { status: 'approved' });
    }

    return Response.json({
      series: newSeries,
      usage: result.usage,
    }, { status: 201 });
  } catch (error) {
    console.error('Generate series error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate series';
    return Response.json({ error: message }, { status: 500 });
  }
}
