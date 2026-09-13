import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import dbConnect from '@/lib/db';
import Series from '@/models/Series';
import Episode from '@/models/Episode';
import { getCurrentUser } from '@/lib/auth';
import { generateStructured, trackUsage } from '@/lib/ai/client';
import { CONTINUITY_SYSTEM_PROMPT, buildContinuityCheckPrompt } from '@/lib/ai/prompts/continuity';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const checkInputSchema = z.object({
  newContent: z.string().min(1, 'New content or script to check is required'),
});

const continuityOutputSchema = z.object({
  continuityScore: z.number().min(1).max(10),
  issues: z.array(
    z.object({
      type: z.enum(['character', 'location', 'timeline', 'plot', 'worldRule']).catch('plot'),
      severity: z.enum(['critical', 'warning', 'minor']).catch('warning'),
      description: z.string(),
      reference: z.string().catch(''),
      suggestion: z.string().catch(''),
    })
  ).catch([]),
  openThreads: z.array(
    z.object({
      thread: z.string(),
      introducedIn: z.string().catch('Earlier'),
      status: z.enum(['open', 'partially_resolved', 'resolved']).catch('open'),
    })
  ).catch([]),
  summary: z.string().catch(''),
});

// POST /api/series/[id]/continuity-check
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = checkInputSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    await dbConnect();

    const series = await Series.findOne({ _id: id, userId: user.userId }).lean();
    if (!series) {
      return Response.json({ error: 'Series not found' }, { status: 404 });
    }

    // Load past episodes summaries
    const pastEpisodes = await Episode.find({ seriesId: id, userId: user.userId })
      .sort({ episodeNumber: 1 })
      .select('episodeNumber title hook script ending')
      .lean();

    const pastEpisodesString = pastEpisodes.length > 0
      ? pastEpisodes.map(
          (ep) =>
            `Episode ${ep.episodeNumber}: "${ep.title}"\nHook: ${ep.hook}\nEnding: ${ep.ending}\nScript Excerpt: ${ep.script.slice(0, 300)}...`
        ).join('\n---\n')
      : 'No prior episodes yet.';

    const charactersString = series.characters
      .map(
        (c) =>
          `${c.name} (${c.role}): Appearance: ${c.appearance}. Clothing: ${c.clothing || 'N/A'}. Personality: ${c.personality || 'N/A'}. Visual: ${c.visualIdentity}`
      )
      .join('\n');

    const locationsString = series.locations
      .map((l) => `${l.name}: ${l.description} | Visual: ${l.visualIdentity}`)
      .join('\n');

    const bibleString = [
      `Premise: ${series.premise}`,
      `Theme: ${series.theme}`,
      `Story Arc: ${series.seriesBible?.storyArc || 'N/A'}`,
      `World Rules:\n${series.seriesBible?.worldRules?.map((r) => `- ${r}`).join('\n') || 'None'}`,
      `Current Mystery: ${series.seriesBible?.storyState?.currentMystery || 'N/A'}`,
      `Known Info: ${series.seriesBible?.storyState?.knownInformation?.join(', ') || 'N/A'}`,
    ].join('\n\n');

    const prompt = buildContinuityCheckPrompt({
      seriesBible: bibleString,
      previousEpisodes: pastEpisodesString,
      newContent: parsed.data.newContent,
      characters: charactersString || 'None specified',
      locations: locationsString || 'None specified',
    });

    const result = await generateStructured({
      messages: [
        { role: 'system', content: CONTINUITY_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      schema: continuityOutputSchema,
      temperature: 0.3,
      maxTokens: 3000,
    });

    if (result.usage) {
      trackUsage(result.usage.totalTokens);
    }

    return Response.json({
      continuityScore: result.data.continuityScore * 10, // Scale 1-10 to 10-100
      scoreRaw: result.data.continuityScore,
      issues: result.data.issues,
      openThreads: result.data.openThreads,
      summary: result.data.summary,
      usage: result.usage,
    });
  } catch (error) {
    console.error('Continuity check error:', error);
    const message = error instanceof Error ? error.message : 'Continuity check failed';
    return Response.json({ error: message }, { status: 500 });
  }
}
