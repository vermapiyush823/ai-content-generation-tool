import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import dbConnect from '@/lib/db';
import Scene from '@/models/Scene';
import Channel from '@/models/Channel';
import Series from '@/models/Series';
import { getCurrentUser } from '@/lib/auth';
import { generateStructured, trackUsage } from '@/lib/ai/client';
import { VIDEO_PROMPT_SYSTEM, buildVideoPromptGenerationPrompt } from '@/lib/ai/prompts/videoPrompt';
import { getPromptAdapter } from '@/lib/ai/adapters';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const regenSchema = z.object({
  instruction: z.string().optional(),
  targetModel: z.enum(['generic', 'gemini', 'grok', 'all']).default('all'),
});

const promptOutputSchema = z.object({
  prompt: z.string(),
  negativePrompt: z.string().optional().catch(''),
});

// POST /api/scenes/[id]/regenerate — regenerate prompt(s) for a single scene
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const parsed = regenSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { instruction, targetModel } = parsed.data;

    await dbConnect();

    const scene = await Scene.findOne({ _id: id, userId: user.userId });
    if (!scene) {
      return Response.json({ error: 'Scene not found' }, { status: 404 });
    }

    const channel = await Channel.findById(scene.channelId);

    // If custom instruction provided, use AI to rewrite the visual or prompt
    if (instruction) {
      const prompt = buildVideoPromptGenerationPrompt({
        scene: {
          visualDescription: `${scene.visualDescription}. Instruction: ${instruction}`,
          camera: scene.camera,
          lighting: scene.lighting,
          environment: scene.environment,
          characterActions: scene.characterActions,
          duration: `${scene.duration}s`,
        },
        visualStyle: channel?.visualStyle || 'Cinematic',
        targetModel: targetModel === 'all' ? 'Gemini' : targetModel,
      });

      const result = await generateStructured({
        messages: [
          { role: 'system', content: VIDEO_PROMPT_SYSTEM },
          { role: 'user', content: prompt },
        ],
        schema: promptOutputSchema,
        temperature: 0.7,
      });

      if (result.usage) {
        trackUsage(result.usage.totalTokens);
      }

      if (targetModel === 'generic' || targetModel === 'all') {
        scene.prompts.generic = result.data.prompt;
      }
      if (targetModel === 'gemini' || targetModel === 'all') {
        scene.prompts.gemini = result.data.prompt;
      }
      if (targetModel === 'grok' || targetModel === 'all') {
        scene.prompts.grok = result.data.prompt;
      }
    } else {
      // Re-run adapter
      const sceneData = {
        sceneNumber: scene.sceneNumber,
        duration: `${scene.duration}s`,
        narration: scene.narration,
        dialogue: scene.dialogue || null,
        visualDescription: scene.visualDescription,
        camera: scene.camera,
        lighting: scene.lighting,
        environment: scene.environment,
        characterActions: scene.characterActions,
        soundDesign: scene.soundDesign,
        transition: scene.transition,
      };

      if (targetModel === 'generic' || targetModel === 'all') {
        const adapter = getPromptAdapter('generic');
        scene.prompts.generic = adapter.formatPrompt(sceneData, [], channel?.visualStyle).prompt;
      }
      if (targetModel === 'gemini' || targetModel === 'all') {
        const adapter = getPromptAdapter('gemini');
        scene.prompts.gemini = adapter.formatPrompt(sceneData, [], channel?.visualStyle).prompt;
      }
      if (targetModel === 'grok' || targetModel === 'all') {
        const adapter = getPromptAdapter('grok');
        scene.prompts.grok = adapter.formatPrompt(sceneData, [], channel?.visualStyle).prompt;
      }
    }

    await scene.save();

    return Response.json({ scene });
  } catch (error) {
    console.error('Regenerate scene error:', error);
    const message = error instanceof Error ? error.message : 'Failed to regenerate scene';
    return Response.json({ error: message }, { status: 500 });
  }
}
