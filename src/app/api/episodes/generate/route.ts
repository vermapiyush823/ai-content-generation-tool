import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import dbConnect from '@/lib/db';
import Channel from '@/models/Channel';
import Series from '@/models/Series';
import Episode from '@/models/Episode';
import ContentIdea from '@/models/ContentIdea';
import { getCurrentUser } from '@/lib/auth';
import { generateStructured, trackUsage } from '@/lib/ai/client';
import { EPISODE_SYSTEM_PROMPT, buildEpisodeGenerationPrompt } from '@/lib/ai/prompts/episode';

const generateEpisodeInputSchema = z.object({
  channelId: z.string().min(1, 'Channel ID is required'),
  seriesId: z.string().optional(),
  ideaId: z.string().optional(),
  title: z.string().optional(),
  episodeNumber: z.number().optional(),
  customPrompt: z.string().optional(),
  targetDuration: z.string().default('30-45 seconds'),
});

const episodeOutputSchema = z.object({
  title: z.string(),
  hook: z.string(),
  objective: z.string().catch(''),
  script: z.object({
    hook: z.string().catch(''),
    setup: z.string().catch(''),
    escalation: z.string().catch(''),
    payoff: z.string().catch(''),
    cliffhanger: z.string().nullable().catch(''),
  }),
  duration: z.string().or(z.number()).catch(35),
  ending: z.string().catch(''),
  narratorNotes: z.string().catch(''),
  continuityNotes: z.string().catch(''),
  caption: z.string().optional().catch(''),
  cta: z.string().optional().catch(''),
  hashtags: z.array(z.string()).optional().catch([]),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = generateEpisodeInputSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { channelId, seriesId, ideaId, title, episodeNumber, customPrompt, targetDuration } =
      parsed.data;

    await dbConnect();

    // 1. Channel DNA
    const channel = await Channel.findOne({ _id: channelId, userId: user.userId });
    if (!channel) {
      return Response.json({ error: 'Channel not found' }, { status: 404 });
    }

    const dna = channel.channelDNA;
    const channelDNAString = [
      `Channel: ${channel.name}`,
      `Genre: ${channel.genre}`,
      `Tone: ${channel.tone}`,
      `Language: ${channel.language}`,
      `Audience: ${channel.audience}`,
      `Visual Style: ${channel.visualStyle}`,
      `Narration: ${channel.narrationStyle}`,
      `Hook Style: ${channel.hookStyle}`,
      `Ending Style: ${channel.endingStyle}`,
      `Forbidden: ${channel.forbiddenTopics?.join(', ') || 'None'}`,
    ].join('\n');

    // 2. Series context (if applicable)
    let seriesBibleString = '';
    let pastEpisodesString = '';
    let episodeOutlineString = customPrompt || '';
    let calcEpisodeNumber = episodeNumber || 1;

    if (seriesId) {
      const series = await Series.findOne({ _id: seriesId, userId: user.userId });
      if (series) {
        calcEpisodeNumber = episodeNumber || series.currentEpisode || 1;

        // Bible details
        const charDetails = series.characters
          ?.map(
            (c) =>
              `- ${c.name} (${c.role}): ${c.visualIdentity || c.appearance}. Personality: ${c.personality}`
          )
          .join('\n');

        const locDetails = series.locations
          ?.map((l) => `- ${l.name}: ${l.description} (Visual: ${l.visualIdentity})`)
          .join('\n');

        const rules = series.seriesBible?.worldRules?.map((r) => `- ${r}`).join('\n');

        seriesBibleString = [
          `Series Title: ${series.title}`,
          `Premise: ${series.premise}`,
          `Theme: ${series.theme}`,
          `Arc: ${series.seriesBible?.storyArc}`,
          `Current Mystery: ${series.seriesBible?.storyState?.currentMystery}`,
          `Characters:\n${charDetails || 'None'}`,
          `Locations:\n${locDetails || 'None'}`,
          `World Rules:\n${rules || 'None'}`,
        ].join('\n\n');

        // Look for outline of this episode number in the bible
        const outlineMatch = series.seriesBible?.episodeOutlines?.find(
          (o) => o.episodeNumber === calcEpisodeNumber
        );
        if (outlineMatch) {
          episodeOutlineString = `Title: ${outlineMatch.title}\nSummary: ${outlineMatch.summary}\nEvents: ${outlineMatch.keyEvents.join(', ')}\nCliffhanger: ${outlineMatch.cliffhanger}`;
        }

        // Prior episodes for continuity
        const priorEpisodes = await Episode.find({
          seriesId,
          episodeNumber: { $lt: calcEpisodeNumber },
        })
          .sort({ episodeNumber: 1 })
          .limit(5)
          .lean();

        if (priorEpisodes.length > 0) {
          pastEpisodesString = priorEpisodes
            .map(
              (ep) =>
                `EP ${ep.episodeNumber}: "${ep.title}" -> Hook: ${ep.hook} | Ending: ${ep.ending} | Cliffhanger: ${ep.cliffhanger}`
            )
            .join('\n');
        }
      }
    } else if (ideaId) {
      const idea = await ContentIdea.findById(ideaId);
      if (idea) {
        episodeOutlineString = `Concept: ${idea.concept}\nHook idea: ${idea.hook}\nTitle: ${idea.title}`;
      }
    }

    const prompt = buildEpisodeGenerationPrompt({
      channelDNA: channelDNAString,
      seriesBible: seriesBibleString || undefined,
      previousEpisodes: pastEpisodesString || undefined,
      episodeNumber: calcEpisodeNumber,
      episodeOutline: episodeOutlineString || (title ? `Title idea: ${title}` : undefined),
      genre: channel.genre,
      language: channel.language,
      duration: targetDuration,
    });

    const result = await generateStructured({
      messages: [
        { role: 'system', content: EPISODE_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      schema: episodeOutputSchema,
      temperature: 0.75,
      maxTokens: 4096,
    });

    if (result.usage) {
      trackUsage(result.usage.totalTokens);
    }

    const data = result.data;

    // Full formatted script
    const structuredScript = data.script;
    const fullScriptText = [
      `[HOOK]\n${structuredScript.hook}`,
      `[SETUP]\n${structuredScript.setup}`,
      `[ESCALATION]\n${structuredScript.escalation}`,
      `[PAYOFF]\n${structuredScript.payoff}`,
      structuredScript.cliffhanger ? `[CLIFFHANGER]\n${structuredScript.cliffhanger}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    // Parse duration to number
    let numDuration = 30;
    if (typeof data.duration === 'number') {
      numDuration = data.duration;
    } else if (typeof data.duration === 'string') {
      const matched = data.duration.match(/\d+/);
      if (matched) numDuration = parseInt(matched[0], 10);
    }

    const episode = await Episode.create({
      episodeNumber: calcEpisodeNumber,
      title: data.title || title || `Episode ${calcEpisodeNumber}`,
      hook: data.hook || structuredScript.hook,
      objective: data.objective,
      script: fullScriptText,
      scriptStructure: {
        hook: structuredScript.hook,
        setup: structuredScript.setup,
        escalation: structuredScript.escalation,
        payoff: structuredScript.payoff,
        cliffhangerOrCta: structuredScript.cliffhanger || '',
      },
      duration: numDuration,
      ending: data.ending,
      cliffhanger: structuredScript.cliffhanger || '',
      status: 'script_ready',
      seriesId: seriesId ? seriesId : undefined,
      channelId,
      userId: user.userId,
      qualityScore: 88,
      continuityScore: seriesId ? 92 : undefined,
      caption: data.caption || `${data.title} — Watch till the end!`,
      cta: data.cta || 'Follow for Part ' + (calcEpisodeNumber + 1),
      hashtags: data.hashtags?.length
        ? data.hashtags
        : [`#${channel.genre.toLowerCase().replace(/\s+/g, '')}`, '#shorts', '#viral'],
      sceneCount: 0,
    });

    // Update series currentEpisode if needed
    if (seriesId) {
      await Series.findByIdAndUpdate(seriesId, {
        $max: { currentEpisode: calcEpisodeNumber + 1 },
      });
    }

    // If idea was used, mark approved
    if (ideaId) {
      await ContentIdea.findByIdAndUpdate(ideaId, { status: 'approved' });
    }

    return Response.json({
      episode,
      usage: result.usage,
    }, { status: 201 });
  } catch (error) {
    console.error('Generate episode error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate episode';
    return Response.json({ error: message }, { status: 500 });
  }
}
