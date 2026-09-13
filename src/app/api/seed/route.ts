import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Channel from '@/models/Channel';
import Series from '@/models/Series';
import ContentIdea from '@/models/ContentIdea';
import Episode from '@/models/Episode';
import Scene from '@/models/Scene';
import ContentPerformance from '@/models/ContentPerformance';
import Insight from '@/models/Insight';
import Experiment from '@/models/Experiment';
import DailyContentPackage from '@/models/DailyContentPackage';
import { hashPassword } from '@/lib/auth';

export async function GET(request: NextRequest) {
  return handleSeed(request);
}

export async function POST(request: NextRequest) {
  return handleSeed(request);
}

async function handleSeed(request: NextRequest) {
  try {
    await dbConnect();

    // 1. Find or create demo owner user
    let user = await User.findOne({ email: 'creator@aicontentfactory.com' });
    if (!user) {
      user = await User.findOne({});
    }

    if (!user) {
      const hashedPassword = await hashPassword('password123');
      user = await User.create({
        name: 'Alex Rivera',
        email: 'creator@aicontentfactory.com',
        passwordHash: hashedPassword,
      });
    }

    const userId = user._id;

    // 2. Channel 1: DarkVerse (Horror, Hinglish)
    let darkVerse = await Channel.findOne({ slug: 'darkverse', userId });
    if (!darkVerse) {
      darkVerse = await Channel.create({
        name: 'DarkVerse',
        slug: 'darkverse',
        platforms: ['youtube_shorts', 'instagram_reels'],
        genre: 'Horror',
        subgenre: 'Psychological Supernatural',
        language: 'Hinglish',
        audience: 'Horror mystery fans 18-35',
        ageRange: '18-35',
        geography: 'South Asia & Global Diaspora',
        tone: 'dark cinematic suspense',
        narrationStyle: 'first-person male, urgent whispered confession',
        visualStyle: 'photorealistic cinematic, claustrophobic dim lighting, anamorphic lens flares',
        videoLength: '25-35 seconds',
        contentFrequency: 'Daily',
        seriesPreference: 'series',
        hookStyle: 'immediate unexplained visual anomaly in first 2 seconds',
        endingStyle: 'chilling cliffhanger',
        ctaStyle: 'Follow to see what is behind the door in Part 2',
        contentRules: [
          'Never use cheap jump scares',
          'Tension must escalate every 5 seconds',
          'Sound design must feature sub-bass room tones',
        ],
        forbiddenTopics: ['Cheesy gore', 'Expository voiceovers', 'Cliche screamers'],
        active: true,
        channelDNA: {
          identity: 'The premier serialized psychological horror shorts channel in Hinglish',
          audienceProfile: 'Urban youth who binge true crime and urban legends late at night',
          contentPillars: ['Urban Myths', 'Hotel Mysteries', 'Cursed Timelines', 'Time Anomalies'],
          visualIdentity: 'Moody 35mm film look with deep shadows and muted sepia/teal tones',
          narrativeStyle: 'Urgent eyewitness testimony unfolding in real time',
          competitiveEdge: 'Strict character canon and multi-episode continuity cliffhangers',
          growthStrategy: 'Part-by-part serialized cliffhangers that force profile visits',
        },
        userId,
      });
    }

    // 3. Channel 2: Future Files (Sci-Fi, English)
    let futureFiles = await Channel.findOne({ slug: 'future-files', userId });
    if (!futureFiles) {
      futureFiles = await Channel.create({
        name: 'Future Files',
        slug: 'future-files',
        platforms: ['youtube_shorts', 'tiktok'],
        genre: 'Sci-Fi',
        subgenre: 'Dystopian AI & Deep Space',
        language: 'English',
        audience: 'Tech enthusiasts and speculative fiction fans 18-40',
        ageRange: '18-40',
        geography: 'Global',
        tone: 'intellectual intrigue and creeping dread',
        narrationStyle: 'authoritative documentary investigator',
        visualStyle: 'neo-cyberpunk, crisp holographic HUD reflections, volumetric fog',
        videoLength: '35-50 seconds',
        contentFrequency: 'Daily',
        seriesPreference: 'mixed',
        hookStyle: 'unsettling futuristic technological disclosure',
        endingStyle: 'philosophical gut punch',
        ctaStyle: 'Subscribe for the classified files',
        contentRules: ['Must explore genuine philosophical dilemmas of post-human AI'],
        forbiddenTopics: ['Cartoonish laser battles', 'Magic'],
        active: true,
        channelDNA: {
          identity: 'Speculative fiction uncovering banned technological artifacts of 2084',
          audienceProfile: 'Curious builders, coders, and sci-fi connoisseurs',
          contentPillars: ['Classified AI Incidents', 'Deep Space Glitches', 'Neural Implants'],
          visualIdentity: 'Blade Runner 2049 aesthetic with neon refraction and monolithic structures',
          narrativeStyle: 'Declassified audio logs and forensic analysis',
          competitiveEdge: 'Hyper-detailed scene prompts and cinematic lens specifications',
          growthStrategy: 'Thought-provoking questions that spark lively comment debates',
        },
        userId,
      });
    }

    // 4. Series for DarkVerse: "The 3:17 AM Room"
    let series = await Series.findOne({ title: 'The 3:17 AM Room', userId });
    if (!series) {
      series = await Series.create({
        title: 'The 3:17 AM Room',
        concept:
          'A night auditor at an abandoned heritage hotel discovers that Room 307 unlocks only at exactly 3:17 AM, showing events from 24 hours into the future.',
        genre: 'Horror',
        premise:
          'Kabir takes the night shift at Grand Palace Hotel. At 3:17 AM every night, the brass handle of Room 307 turns on its own. Inside, the furniture is subtly arranged to reenact someone’s death tomorrow.',
        theme: 'The curse of knowing tomorrow’s horror and failing to prevent it',
        status: 'active',
        plannedEpisodes: 6,
        currentEpisode: 3,
        channelId: darkVerse._id,
        userId,
        seriesBible: {
          worldRules: [
            'Room 307 handle only turns at exactly 3:17 AM for 45 seconds',
            'Any object removed from Room 307 vanishes upon crossing the threshold',
            'The entity inside cannot look directly into mirrors',
            'Whatever occurs inside the room happens in the real world exactly 24 hours later',
          ],
          timeline: 'October 12–18, real-time single week progression',
          storyArc:
            'Kabir tries to decipher clues to stop his sister from visiting the hotel on Friday night.',
          episodeOutlines: [
            {
              episodeNumber: 1,
              title: 'The Brass Handle',
              summary: 'Kabir hears the click at 3:17 AM for the first time.',
              keyEvents: ['Clock strikes 3:17', 'Handle turns', 'Footprints appear on carpet'],
              cliffhanger: 'The door slowly creaks open from the inside.',
            },
            {
              episodeNumber: 2,
              title: 'The Mirror Glitch',
              summary: 'Kabir steps inside Room 307 and glances at the antique mirror.',
              keyEvents: ['Temperature plunges', 'Reflection moves 2 seconds late'],
              cliffhanger: 'The reflection points directly behind Kabir.',
            },
            {
              episodeNumber: 3,
              title: 'The Tomorrow Guest',
              summary: 'A guest registers at the front desk whose face was in the room yesterday.',
              keyEvents: ['Guest signs register', 'Name matches bloody luggage tag in Room 307'],
              cliffhanger: 'He asks for the key to Room 307.',
            },
          ],
          storyState: {
            whatHasHappened: ['Kabir witnessed the handle turn', 'Saw reflection latency in mirror'],
            currentMystery: 'Who is the entity that leaves damp footprints at 3:17 AM?',
            knownInformation: ['Room 307 was sealed in 1984 after the founder disappeared'],
            unknownInformation: ['Why Kabir’s name is already carved on the nightstand'],
            openThreads: ['The missing master key 307', 'The warning note from the previous auditor'],
            resolvedThreads: ['Confirmed that the digital clock freezes at 3:17 AM'],
            futureClues: ['A silver cassette tape hidden under the floorboards'],
          },
        },
        characters: [
          {
            name: 'Kabir Sharma',
            age: '27',
            appearance: 'Tired dark circles, messy black hair, lean build',
            clothing: 'Faded navy blue night auditor blazer with brass name tag, rolled up sleeves',
            personality: 'Observant, skeptical turned terrified, relentlessly protective',
            role: 'protagonist',
            visualIdentity:
              'South Asian male in 20s, nervous gaze, clutching heavy iron flashlight and brass key ring',
          },
          {
            name: 'The Silhouette',
            age: 'Ageless',
            appearance: 'Tall distorted human form draped in decayed 1940s hotel porter uniform',
            clothing: 'Tattered maroon bellhop uniform with tarnished buttons',
            personality: 'Methodical, silent, stalks boundaries of shadows',
            role: 'antagonist',
            visualIdentity:
              'Faceless humanoid silhouette whose eyes reflect ambient dim amber light like a feline',
          },
        ],
        locations: [
          {
            name: 'Room 307',
            description:
              'An opulent but decaying 1930s hotel suite with peeling damask wallpaper and an ornate mahogany four-poster bed.',
            visualIdentity:
              'Sickly green wall sconces, heavy velvet drapes frozen mid-flutter, floating dust motes',
            importantDetails: ['No windows open', 'Antique oval mirror facing the entrance'],
          },
          {
            name: 'The 3rd Floor Corridor',
            description: 'Long narrow hallway lined with red geometric carpet and flickering warm lights.',
            visualIdentity: 'Endless vanishing point perspective shot down crimson runner rug',
            importantDetails: ['Fire alarm blinks red every 10 seconds'],
          },
        ],
      });
    }

    // 5. Episode 1 for "The 3:17 AM Room"
    let ep1 = await Episode.findOne({ title: 'The Brass Handle', seriesId: series._id });
    if (!ep1) {
      ep1 = await Episode.create({
        episodeNumber: 1,
        title: 'The Brass Handle',
        hook: 'Watch that door handle. It’s 3:16 AM. In ten seconds, you’ll see why nobody takes this night shift.',
        objective: 'Establish the core anomaly and hook audience with irresistible physical tension',
        script: `[HOOK]
Watch that brass handle. It's 3:16 AM. In ten seconds, you'll understand why five night auditors quit this week.

[SETUP]
Pura hotel bilkul silent hai. Lekin har raat, 3rd floor ke Room 307 ke bahar, temperature 5 degrees drop ho jata hai. Nobody has checked into this room since 1984.

[ESCALATION]
3:16:58... 59... The antique grandfather clock clicks. Dekho. The heavy brass handle slowly begins to turn downward. No footsteps on this side. No shadow beneath the crack.

[PAYOFF]
Click. The deadbolt unlocks from the INSIDE. The door eases open by exactly two inches.

[CLIFFHANGER]
And from the darkness inside... someone whispers my name. Follow for Part 2.`,
        duration: 32,
        ending: 'Door clicks open 2 inches as a low whisper echoes through the hall',
        cliffhanger: 'The whisper calls Kabir by his private childhood nickname',
        status: 'prompts_ready',
        seriesId: series._id,
        channelId: darkVerse._id,
        userId,
        caption: 'Part 1: The 3:17 AM Room. What happens when the lock turns itself? #horror #darkverse',
        cta: 'Follow for Part 2 releasing tomorrow at 9 PM',
        hashtags: ['#darkverse', '#hindihits', '#horrorshorts', '#mystery', '#scarystories'],
        qualityScore: 94,
        continuityScore: 98,
        sceneCount: 3,
      });

      // Scenes for Episode 1
      await Scene.create([
        {
          episodeId: ep1._id,
          channelId: darkVerse._id,
          userId,
          sceneNumber: 1,
          duration: 5,
          narration:
            'Watch that brass handle. It’s 3:16 AM. In ten seconds, you’ll understand why five night auditors quit this week.',
          visualDescription:
            'Extreme close-up macro shot of an ornate antique brass hotel door handle with Room 307 engraved on a tarnished plate. Dim eerie hallway lighting casting long shadows.',
          camera: 'Slow creep-in macro shot, shallow depth of field',
          lighting: 'Dim amber tungsten with cold teal edge rim lighting',
          environment: 'Hotel corridor with peeling vintage damask wallpaper',
          characterActions: 'No character in frame, handle is stationary under heavy suspense',
          soundDesign: 'Ticking grandfather clock amplifying with low 40Hz sub bass drone',
          transition: 'Whip pan to digital watch',
          prompts: {
            generic:
              'Macro cinematic 9:16 shot of antique brass door handle numbered 307, dim hallway, moody suspense, 35mm film grain, 4k photorealistic.',
            gemini:
              'Extreme close-up macro of an ornate antique brass door handle labeled Room 307. Dim amber hotel hallway lighting with cold teal rim lights. Camera: Slow creeping push-in on anamorphic 50mm lens. Setting: Narrow hotel corridor with textured damask wallpaper. Aesthetic: Photorealistic cinematic horror, fine film grain, moody shadows.',
            grok:
              'Suspenseful atmospheric shot of brass hotel door handle numbered 307. Dim practical lighting, creeping camera angle, dark claustrophobic mood, crisp textures, ultra-detailed 8k.',
          },
        },
        {
          episodeId: ep1._id,
          channelId: darkVerse._id,
          userId,
          sceneNumber: 2,
          duration: 6,
          narration:
            '3:16:58... 59... Dekho. The heavy brass handle slowly begins to turn downward. No footsteps on this side.',
          visualDescription:
            'The brass handle begins rotating downward with mechanical weight. A young South Asian night auditor in a blue blazer watches with terrified eyes, holding a heavy iron flashlight.',
          camera: 'Low angle medium shot looking up from handle to Kabir’s tense expression',
          lighting: 'Harsh flashlight beam cutting through floating dust motes',
          environment: 'Red geometric carpeted hallway',
          characterActions: 'Kabir Sharma backing up slowly against the wall, breath fogging up slightly',
          soundDesign: 'Heavy metallic creak of internal lock mechanisms turning',
          transition: 'Cut to door seam',
          prompts: {
            generic:
              'Low angle cinematic 9:16 view of door handle turning by itself as a terrified night auditor in blazer watches in shock, flashlight beam, dark hallway.',
            gemini:
              'Low angle medium shot looking up at brass door handle rotating downwards without human touch. In background, Kabir Sharma (27yo South Asian male in navy blazer with brass tag) watches in frozen terror, breath visible in cold air. Camera: Subtle handheld camera shake. Setting: Heritage hotel hallway with crimson carpet. Aesthetic: High contrast dark cinematic horror.',
            grok:
              'Terrifying slow motion scene of brass door handle turning mechanically on its own. Flashlight beam illuminating dust in air, night auditor staring in dread, cinematic lighting, 9:16 aspect ratio.',
          },
        },
        {
          episodeId: ep1._id,
          channelId: darkVerse._id,
          userId,
          sceneNumber: 3,
          duration: 6,
          narration:
            'Click. The deadbolt unlocks from the inside. And from the darkness... someone whispers my name.',
          visualDescription:
            'The heavy wooden door unlatches with a loud heavy click and slowly glides inward by two inches, revealing pitch black darkness with a fleeting hint of a tall shadowy porter silhouette inside.',
          camera: 'Slow tracking dolly-in toward the open gap into total blackness',
          lighting: 'Total darkness inside room contrasting with dim hallway lights',
          environment: 'Room 307 entrance threshold',
          characterActions: 'The door glides smoothly open into darkness',
          soundDesign: 'Heavy thud of deadbolt releasing followed by chilling whispered voice',
          transition: 'Sudden cut to black',
          prompts: {
            generic:
              'Creepy hotel room door unlocking and opening 2 inches into pitch black darkness, eerie silhouette inside, cinematic horror 9:16.',
            gemini:
              'Cinematic push-in shot toward a hotel door opening two inches into pitch black darkness. Faint outline of a tall shadowy porter silhouette with tarnished buttons barely visible in darkness. Camera: Slow smooth dolly in toward the crack of the door. Setting: Dark corridor threshold. Aesthetic: Chilling photorealistic horror, anamorphic bokeh.',
            grok:
              'Dark atmospheric horror scene of hotel room door cracking open into total black void. Unsettling silhouette barely visible in shadows, dramatic cinematic lighting, photorealistic suspense.',
          },
        },
      ]);
    }

    // 6. Seed Performance Logs for DarkVerse & Future Files
    const existingPerf = await ContentPerformance.countDocuments({ userId });
    if (existingPerf === 0) {
      await ContentPerformance.insertMany([
        {
          channelId: darkVerse._id,
          episodeId: ep1._id,
          userId,
          title: 'The Brass Handle (EP01)',
          platform: 'youtube_shorts',
          views: 184200,
          likes: 16420,
          comments: 3410,
          shares: 9120,
          saves: 4200,
          followersGained: 2150,
          completionRate: 88,
          averagePercentageViewed: 88,
          videoDuration: 32,
          publishDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          notes: 'Immediate handle turn in first 2 seconds created viral loop.',
        },
        {
          channelId: darkVerse._id,
          userId,
          title: 'The Elevator at 4 AM',
          platform: 'instagram_reels',
          views: 92400,
          likes: 8140,
          comments: 1240,
          shares: 4200,
          saves: 1900,
          followersGained: 820,
          completionRate: 82,
          averagePercentageViewed: 82,
          videoDuration: 28,
          publishDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          channelId: futureFiles._id,
          userId,
          title: 'The 2084 Memory Leak Incident',
          platform: 'youtube_shorts',
          views: 142100,
          likes: 11200,
          comments: 1890,
          shares: 6100,
          saves: 3400,
          followersGained: 1400,
          completionRate: 79,
          averagePercentageViewed: 79,
          videoDuration: 42,
          publishDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      ]);
    }

    // 7. Seed Insights
    const existingInsights = await Insight.countDocuments({ userId });
    if (existingInsights === 0) {
      await Insight.insertMany([
        {
          channelId: darkVerse._id,
          userId,
          category: 'hook',
          observation:
            'Immediate physical anomaly hooks (e.g. moving door handle, clock glitch) outperform talking-head intros by 2.3x.',
          evidence:
            'EP01 achieved 88% completion with unexplained motion in the first 2 seconds vs 58% on slow exposition.',
          confidence: 'high',
          recommendation:
            'Start every video with a physical object moving or malfunctioning before dialogue starts.',
          sampleSize: 12,
          active: true,
        },
        {
          channelId: darkVerse._id,
          userId,
          category: 'duration',
          observation:
            'Horror scripts between 25-33 seconds achieve highest loop replay rate on YouTube Shorts.',
          evidence: 'Videos under 35s retain 84% average view duration; 60s drops to 52%.',
          confidence: 'high',
          recommendation: 'Cap episode scripts to a maximum of 4 tight scenes totaling 28-32 seconds.',
          sampleSize: 14,
          active: true,
        },
      ]);
    }

    // 8. Seed Daily Package
    const todayStr = new Date().toISOString().split('T')[0];
    await DailyContentPackage.findOneAndUpdate(
      { date: todayStr, channelId: darkVerse._id },
      {
        date: todayStr,
        channelId: darkVerse._id,
        userId,
        strategy: {
          objective: 'Capitalize on Room 307 cliffhanger to drive 85%+ completion',
          focus: 'First-person eyewitness discovery of the room’s interior',
          avoid: 'Long backstory of the founder; stick to real-time physical terror',
          experiment: 'Introduce reflective mirror anomaly in Scene 2',
          reason: 'Viewers in comments are obsessively debating what was behind the door',
        },
        episodes: [ep1._id],
        status: 'completed',
      },
      { upsert: true }
    );

    return Response.json({
      success: true,
      message: 'Seed data successfully loaded!',
      data: {
        channels: ['DarkVerse', 'Future Files'],
        series: 'The 3:17 AM Room',
        episodes: 1,
        scenes: 3,
        performanceLogs: 3,
        insights: 2,
      },
    });
  } catch (error) {
    console.error('Seed data error:', error);
    return Response.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}
