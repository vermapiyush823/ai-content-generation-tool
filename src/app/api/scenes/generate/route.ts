import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import dbConnect from '@/lib/db';
import Episode from '@/models/Episode';
import Channel from '@/models/Channel';
import Series from '@/models/Series';
import Scene from '@/models/Scene';
import { getCurrentUser } from '@/lib/auth';
import { generateStructured, trackUsage, NVIDIA_SCENE_MODEL } from '@/lib/ai/client';
import { SCENE_SYSTEM_PROMPT, buildSceneBreakdownPrompt } from '@/lib/ai/prompts/scene';
import { generateAllPrompts } from '@/lib/ai/adapters';

const inputSchema = z.object({
  episodeId: z.string().min(1, 'Episode ID is required'),
});

const sceneItemSchema = z.object({
  sceneNumber: z.number(),
  duration: z.string().or(z.number()).catch('5s'),
  narration: z.string().catch(''),
  dialogue: z.string().nullable().catch(null),
  visualDescription: z.string(),
  camera: z.string().catch('cinematic medium shot'),
  lighting: z.string().catch('atmospheric lighting'),
  environment: z.string().catch(''),
  characterActions: z.string().catch(''),
  soundDesign: z.string().catch('ambient room tone'),
  transition: z.string().catch('cut'),
});

const scenesArraySchema = z.array(sceneItemSchema);

// POST /api/scenes/generate — break script into scenes and generate multi-model video prompts
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { episodeId } = parsed.data;

    await dbConnect();

    // Load episode
    const episode = await Episode.findOne({ _id: episodeId, userId: user.userId });
    if (!episode) {
      return Response.json({ error: 'Episode not found' }, { status: 404 });
    }

    // Load channel
    const channel = await Channel.findById(episode.channelId);
    if (!channel) {
      return Response.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Load series (if part of series) to fetch character & location visual continuity
    let charactersList: any[] = [];
    let locationsString = '';
    let charactersString = '';

    if (episode.seriesId) {
      const series = await Series.findById(episode.seriesId);
      if (series) {
        charactersList = series.characters.map((c) => ({
          name: c.name,
          appearance: c.appearance,
          clothing: c.clothing || '',
          visualIdentity: c.visualIdentity,
        }));

        charactersString = series.characters
          .map((c) => `${c.name}: ${c.visualIdentity} (${c.appearance}, wearing ${c.clothing || 'standard'})`)
          .join('\n');

        locationsString = series.locations
          .map((l) => `${l.name}: ${l.description} | ${l.visualIdentity}`)
          .join('\n');
      }
    }

    // AI Scene Breakdown
    const prompt = buildSceneBreakdownPrompt({
      script: episode.script,
      characters: charactersString || undefined,
      locations: locationsString || undefined,
      visualStyle: channel.visualStyle || 'Cinematic, high contrast, photorealistic',
      duration: `${episode.duration} seconds`,
    });

    const result = await generateStructured({
      messages: [
        { role: 'system', content: SCENE_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      schema: scenesArraySchema,
      temperature: 0.6,
      maxTokens: 4096,
      model: NVIDIA_SCENE_MODEL,
    });

    if (result.usage) {
      trackUsage(result.usage.totalTokens);
    }

    // Remove existing scenes for this episode if regenerating
    await Scene.deleteMany({ episodeId });

    // Generate multi-model prompts for each scene
    const scenesToInsert = result.data.map((sc, index) => {
      let durationNum = 5;
      if (typeof sc.duration === 'number') {
        durationNum = sc.duration;
      } else if (typeof sc.duration === 'string') {
        const m = sc.duration.match(/\d+/);
        if (m) durationNum = parseInt(m[0], 10);
      }

      const sceneDataForAdapter = {
        sceneNumber: sc.sceneNumber || index + 1,
        duration: `${durationNum}s`,
        narration: sc.narration || '',
        dialogue: sc.dialogue,
        visualDescription: sc.visualDescription,
        camera: sc.camera,
        lighting: sc.lighting,
        environment: sc.environment,
        characterActions: sc.characterActions,
        soundDesign: sc.soundDesign,
        transition: sc.transition,
      };

      const prompts = generateAllPrompts(
        sceneDataForAdapter,
        charactersList,
        channel.visualStyle
      );

      return {
        episodeId: episode._id,
        channelId: channel._id,
        userId: user.userId,
        sceneNumber: sc.sceneNumber || index + 1,
        duration: durationNum,
        narration: sc.narration,
        dialogue: sc.dialogue || '',
        visualDescription: sc.visualDescription,
        camera: sc.camera,
        lighting: sc.lighting,
        environment: sc.environment,
        characterActions: sc.characterActions,
        soundDesign: sc.soundDesign,
        transition: sc.transition,
        prompts: {
          generic: prompts.generic.prompt,
          gemini: prompts.gemini.prompt,
          grok: prompts.grok.prompt,
        },
        characterReferences: charactersList.map((c) => c.name),
      };
    });

    const insertedScenes = await Scene.insertMany(scenesToInsert);

    // Update episode status and sceneCount
    await Episode.findByIdAndUpdate(episodeId, {
      status: 'prompts_ready',
      sceneCount: insertedScenes.length,
    });

    return Response.json({
      scenes: insertedScenes,
      count: insertedScenes.length,
      usage: result.usage,
    }, { status: 201 });
  } catch (error) {
    console.error('Generate scenes error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate scenes';
    return Response.json({ error: message }, { status: 500 });
  }
}
