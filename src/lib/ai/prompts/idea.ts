/**
 * Idea Generation Prompt Template v1
 * Generates content ideas for a channel based on its DNA.
 */

export const IDEA_SYSTEM_PROMPT = `You are an expert short-form video content strategist.
Your job is to generate unique, high-retention content ideas for short-form video channels.

Rules:
- Every idea must be specific, not generic
- Every idea must have a strong visual hook that works in the first 1-2 seconds
- Favor concepts that create curiosity gaps
- Avoid overused AI clichés ("What if I told you...", "Scientists were shocked...")
- Avoid generic topics without a unique angle
- Respect the channel's DNA, forbidden topics, and content rules
- Each idea must feel fresh — avoid repeating patterns from recent content
- Score each idea honestly on: novelty, retention potential, visual potential, and production difficulty
- Always prioritize short-form retention (25-90 seconds)`;

export function buildIdeaGenerationPrompt(params: {
  channelDNA: string;
  recentIdeas?: string[];
  count: number;
  genre: string;
  language: string;
  insights?: string;
}): string {
  const { channelDNA, recentIdeas, count, genre, language, insights } = params;

  let prompt = `Generate ${count} unique content ideas for a ${genre} channel.

## Channel DNA
${channelDNA}

## Language
${language}

## Output Format
Respond ONLY with a JSON array of objects. Each object must have:
{
  "title": "Short, catchy title",
  "concept": "2-3 sentence concept description",
  "hook": "The opening visual/audio hook (first 2 seconds)",
  "genre": "${genre}",
  "format": "standalone | series_potential | sequel",
  "seriesPotential": true/false,
  "visualPotential": 1-10,
  "noveltyScore": 1-10,
  "retentionPotential": 1-10,
  "productionDifficulty": 1-10,
  "overallScore": 1-10,
  "reasoning": "Why this idea works for this channel"
}`;

  if (recentIdeas && recentIdeas.length > 0) {
    prompt += `\n\n## Recent Ideas (DO NOT repeat similar concepts)
${recentIdeas.map((idea, i) => `${i + 1}. ${idea}`).join('\n')}`;
  }

  if (insights) {
    prompt += `\n\n## Performance Insights (use these to inform your ideas)
${insights}`;
  }

  return prompt;
}
