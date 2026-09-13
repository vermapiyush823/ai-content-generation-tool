import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Channel from '@/models/Channel';
import Series from '@/models/Series';
import Episode from '@/models/Episode';
import Scene from '@/models/Scene';
import Insight from '@/models/Insight';
import ContentPerformance from '@/models/ContentPerformance';
import DailyContentPackage from '@/models/DailyContentPackage';
import EmailJob from '@/models/EmailJob';
import Settings from '@/models/Settings';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';
import { generateStructured, trackUsage } from '@/lib/ai/client';
import { EPISODE_SYSTEM_PROMPT, buildEpisodeGenerationPrompt } from '@/lib/ai/prompts/episode';
import { SCENE_SYSTEM_PROMPT, buildSceneBreakdownPrompt } from '@/lib/ai/prompts/scene';
import { generateAllPrompts } from '@/lib/ai/adapters';
import { sendDailyPackageEmail } from '@/lib/email';
import { z } from 'zod/v4';

// GET /api/daily-package — list historical packages
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const date = searchParams.get('date');

    await dbConnect();

    const filter: Record<string, unknown> = { userId: user.userId };
    if (date) filter.date = date;

    const packages = await DailyContentPackage.find(filter)
      .populate('channelId', 'name genre slug')
      .populate({
        path: 'episodes',
        populate: { path: 'seriesId', select: 'title' },
      })
      .sort({ date: -1, createdAt: -1 })
      .limit(30)
      .lean();

    return Response.json({ packages });
  } catch (error) {
    console.error('List daily packages error:', error);
    return Response.json({ error: 'Failed to load packages' }, { status: 500 });
  }
}

const strategyOutputSchema = z.object({
  objective: z.string(),
  focus: z.string(),
  avoid: z.string(),
  experiment: z.string().default(''),
  reason: z.string(),
});

const episodeOutputSchema = z.object({
  title: z.string(),
  hook: z.string(),
  objective: z.string().catch(''),
  script: z.object({
    hook: z.string(),
    setup: z.string(),
    escalation: z.string(),
    payoff: z.string(),
    cliffhanger: z.string().nullable().catch(''),
  }),
  duration: z.string().or(z.number()).catch(30),
  ending: z.string().catch(''),
  caption: z.string().optional().catch(''),
  cta: z.string().optional().catch(''),
});

const scenesArraySchema = z.array(
  z.object({
    sceneNumber: z.number(),
    duration: z.string().or(z.number()).catch('5s'),
    narration: z.string().catch(''),
    dialogue: z.string().nullable().catch(null),
    visualDescription: z.string(),
    camera: z.string().catch('cinematic shot'),
    lighting: z.string().catch('dramatic lighting'),
    environment: z.string().catch(''),
    characterActions: z.string().catch(''),
    soundDesign: z.string().catch(''),
    transition: z.string().catch('cut'),
  })
);

// POST /api/daily-package — generate daily package for all active channels
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const todayStr = new Date().toISOString().split('T')[0];

    // Load active channels
    const channels = await Channel.find({ userId: user.userId, active: true });
    if (channels.length === 0) {
      return Response.json({ error: 'No active channels found' }, { status: 400 });
    }

    // Load user settings
    const settings = await Settings.findOne({ userId: user.userId });
    const emailRecipient = settings?.emailSettings?.recipientEmail || user.email;

    const emailChannelsData: any[] = [];
    const generatedPackages: any[] = [];

    for (const ch of channels) {
      // 1. Synthesize Today's Strategy from DNA + Insights
      const insights = await Insight.find({ channelId: ch._id, active: true })
        .sort({ createdAt: -1 })
        .limit(3);

      const insightsContext = insights
        .map((i) => `Pattern: ${i.observation}. Recommendation: ${i.recommendation}`)
        .join('; ');

      const strategyPrompt = `You are the lead content strategist for "${ch.name}" (${ch.genre}).
Determine today's short-form strategy.
Channel DNA: ${ch.channelDNA?.identity || ch.tone || 'Cinematic suspense'}
Preferred Duration: ${ch.videoLength}
Audience: ${ch.audience}
Recent Insights: ${insightsContext || 'Prioritize immediate visual hooks and high pacing'}

Respond ONLY with JSON:
{
  "objective": "Clear primary goal (e.g. Increase completion rate)",
  "focus": "Specific content angle or storytelling mechanism to emphasize",
  "avoid": "What to avoid today",
  "experiment": "Minor variable to test",
  "reason": "Strategic justification"
}`;

      let strategy = {
        objective: 'Maximize 3-second hook retention and completion',
        focus: `${ch.genre} high-tension storytelling`,
        avoid: 'Slow exposition in the first 5 seconds',
        experiment: 'Open directly with an unexplained visual anomaly',
        reason: 'Immediate tension drives higher completion on short-form platforms',
      };

      try {
        const stratResult = await generateStructured({
          messages: [{ role: 'user', content: strategyPrompt }],
          schema: strategyOutputSchema,
          temperature: 0.7,
        });
        if (stratResult.data) strategy = stratResult.data;
        if (stratResult.usage) trackUsage(stratResult.usage.totalTokens);
      } catch (e) {
        console.warn('Strategy generation fallback used:', e);
      }

      // 2. Check for active series to continue
      const activeSeries = await Series.findOne({
        channelId: ch._id,
        userId: user.userId,
        status: 'active',
      });

      let episodeNumber = 1;
      let seriesId: any = undefined;
      let outlinePrompt = '';

      if (activeSeries) {
        seriesId = activeSeries._id;
        episodeNumber = activeSeries.currentEpisode || 1;
        outlinePrompt = `Continue series "${activeSeries.title}". Arc: ${activeSeries.seriesBible?.storyArc}`;
      }

      // 3. Generate Episode Script
      const prompt = buildEpisodeGenerationPrompt({
        channelDNA: `Channel: ${ch.name}, Tone: ${ch.tone}, Visual: ${ch.visualStyle}`,
        episodeNumber,
        episodeOutline: outlinePrompt || `Create an impactful ${ch.genre} standalone script`,
        genre: ch.genre,
        language: ch.language,
        duration: ch.videoLength || '30 seconds',
      });

      const epResult = await generateStructured({
        messages: [
          { role: 'system', content: EPISODE_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        schema: episodeOutputSchema,
        temperature: 0.7,
      });

      if (epResult.usage) trackUsage(epResult.usage.totalTokens);

      const epData = epResult.data;
      const fullScript = [
        `[HOOK]\n${epData.script.hook}`,
        `[SETUP]\n${epData.script.setup}`,
        `[ESCALATION]\n${epData.script.escalation}`,
        `[PAYOFF]\n${epData.script.payoff}`,
        epData.script.cliffhanger ? `[CLIFFHANGER]\n${epData.script.cliffhanger}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      const episode = await Episode.create({
        episodeNumber,
        title: epData.title,
        hook: epData.hook,
        objective: strategy.objective,
        script: fullScript,
        scriptStructure: {
          hook: epData.script.hook,
          setup: epData.script.setup,
          escalation: epData.script.escalation,
          payoff: epData.script.payoff,
          cliffhangerOrCta: epData.script.cliffhanger || '',
        },
        duration: typeof epData.duration === 'number' ? epData.duration : 30,
        ending: epData.ending,
        cliffhanger: epData.script.cliffhanger || '',
        status: 'prompts_ready',
        seriesId,
        channelId: ch._id,
        userId: user.userId,
        caption: epData.caption || epData.title,
        cta: epData.cta || 'Follow for Part ' + (episodeNumber + 1),
        qualityScore: 90,
      });

      if (activeSeries) {
        await Series.findByIdAndUpdate(activeSeries._id, {
          $max: { currentEpisode: episodeNumber + 1 },
        });
      }

      // 4. Generate Scenes and Prompts
      const scenePrompt = buildSceneBreakdownPrompt({
        script: fullScript,
        visualStyle: ch.visualStyle,
        duration: `${episode.duration}s`,
      });

      let scenesData: any[] = [];
      try {
        const scResult = await generateStructured({
          messages: [
            { role: 'system', content: SCENE_SYSTEM_PROMPT },
            { role: 'user', content: scenePrompt },
          ],
          schema: scenesArraySchema,
          temperature: 0.6,
        });

        if (scResult.usage) trackUsage(scResult.usage.totalTokens);

        const scenesToInsert = scResult.data.map((sc, idx) => {
          const formatted = generateAllPrompts(
            {
              sceneNumber: sc.sceneNumber || idx + 1,
              duration: typeof sc.duration === 'number' ? `${sc.duration}s` : sc.duration,
              narration: sc.narration,
              dialogue: sc.dialogue,
              visualDescription: sc.visualDescription,
              camera: sc.camera,
              lighting: sc.lighting,
              environment: sc.environment,
              characterActions: sc.characterActions,
              soundDesign: sc.soundDesign,
              transition: sc.transition,
            },
            [],
            ch.visualStyle
          );

          return {
            episodeId: episode._id,
            channelId: ch._id,
            userId: user.userId,
            sceneNumber: sc.sceneNumber || idx + 1,
            duration: 5,
            narration: sc.narration,
            visualDescription: sc.visualDescription,
            camera: sc.camera,
            lighting: sc.lighting,
            environment: sc.environment,
            characterActions: sc.characterActions,
            soundDesign: sc.soundDesign,
            transition: sc.transition,
            prompts: {
              generic: formatted.generic.prompt,
              gemini: formatted.gemini.prompt,
              grok: formatted.grok.prompt,
            },
          };
        });

        scenesData = await Scene.insertMany(scenesToInsert);
        await Episode.findByIdAndUpdate(episode._id, { sceneCount: scenesData.length });
      } catch (err) {
        console.warn('Scene generation error in daily pack:', err);
      }

      // Save Daily Content Package (upsert for today + channel)
      const pack = await DailyContentPackage.findOneAndUpdate(
        { date: todayStr, channelId: ch._id },
        {
          date: todayStr,
          channelId: ch._id,
          userId: user.userId,
          strategy,
          episodes: [episode._id],
          status: 'completed',
        },
        { upsert: true, new: true }
      );

      generatedPackages.push(pack);

      emailChannelsData.push({
        channelName: ch.name,
        genre: ch.genre,
        strategy,
        videos: [
          {
            title: episode.title,
            hook: episode.hook,
            script: episode.script,
            scenes: scenesData.map((s) => ({
              sceneNumber: s.sceneNumber,
              duration: s.duration,
              prompt: s.prompts.gemini || s.prompts.generic,
            })),
            caption: episode.caption,
            cta: episode.cta,
          },
        ],
      });
    }

    // 5. Send Daily Email via Resend
    let emailStatus: 'pending' | 'generating' | 'completed' | 'failed' | 'emailed' = 'pending';
    let emailError: string | undefined;

    const emailRes = await sendDailyPackageEmail({
      to: emailRecipient,
      date: todayStr,
      channelsData: emailChannelsData,
    });

    if (emailRes.success) {
      emailStatus = 'emailed';
    } else {
      emailStatus = 'failed';
      emailError = emailRes.error;
    }

    // Record Email Job
    await EmailJob.create({
      channelIds: channels.map((c) => c._id),
      recipient: emailRecipient,
      status: emailStatus,
      subject: `🎬 Your Daily Content Pack — ${todayStr}`,
      error: emailError,
      sentAt: emailRes.success ? new Date() : undefined,
      userId: user.userId,
    });

    return Response.json({
      packages: generatedPackages,
      emailStatus,
      recipient: emailRecipient,
      message: `Generated daily package for ${channels.length} channels (${emailStatus})`,
    }, { status: 201 });
  } catch (error) {
    console.error('Daily package generation error:', error);
    const message = error instanceof Error ? error.message : 'Daily package generation failed';
    return Response.json({ error: message }, { status: 500 });
  }
}
