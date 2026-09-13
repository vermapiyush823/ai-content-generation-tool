/**
 * Episode Generation Prompt Template v1
 * Creates individual episodes with structured scripts.
 */

export const EPISODE_SYSTEM_PROMPT = `You are an expert short-form video scriptwriter.
Your job is to create compelling, high-retention scripts for 25-90 second videos.

Rules:
- The hook must grab attention in the first 1-2 seconds
- Every second counts — no filler, no unnecessary exposition
- Structure: Hook → Setup → Escalation → Payoff → Cliffhanger/Ending
- For series: maintain strict continuity with previous episodes
- Dialogue must feel natural for the language/audience
- Include specific visual and audio direction
- The ending must make the viewer want more (series) or feel satisfied (standalone)
- Never use "What if I told you" or similar AI clichés as hooks`;

export function buildEpisodeGenerationPrompt(params: {
  channelDNA: string;
  seriesBible?: string;
  previousEpisodes?: string;
  episodeNumber: number;
  episodeOutline?: string;
  genre: string;
  language: string;
  duration: string;
}): string {
  const {
    channelDNA,
    seriesBible,
    previousEpisodes,
    episodeNumber,
    episodeOutline,
    genre,
    language,
    duration,
  } = params;

  let prompt = `Write Episode ${episodeNumber} of a ${genre} series.

## Channel DNA
${channelDNA}

## Target Duration: ${duration}
## Language: ${language}`;

  if (seriesBible) {
    prompt += `\n\n## Series Bible
${seriesBible}`;
  }

  if (previousEpisodes) {
    prompt += `\n\n## Previous Episodes (MAINTAIN CONTINUITY)
${previousEpisodes}`;
  }

  if (episodeOutline) {
    prompt += `\n\n## Episode Outline
${episodeOutline}`;
  }

  prompt += `

## Output Format
Respond ONLY with a JSON object:
{
  "title": "Episode title",
  "hook": "The opening hook (first 1-2 seconds — visual + audio)",
  "objective": "What this episode achieves in the series arc",
  "script": {
    "hook": "Opening hook script with visual direction",
    "setup": "Setup section with visual direction",
    "escalation": "Rising tension with visual direction",
    "payoff": "Climax/revelation with visual direction",
    "cliffhanger": "Ending hook (null for standalone)"
  },
  "duration": "Estimated duration in seconds",
  "ending": "How the episode ends",
  "narratorNotes": "Notes for narration tone and delivery",
  "continuityNotes": "What carries forward to next episodes"
}`;

  return prompt;
}
