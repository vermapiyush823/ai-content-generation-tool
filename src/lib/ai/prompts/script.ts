/**
 * Script Generation Prompt Template v1
 * Dedicated prompt for generating full narration scripts.
 */

export const SCRIPT_SYSTEM_PROMPT = `You are an expert short-form video narrator and scriptwriter.
Your scripts are designed for maximum retention in 25-90 second videos.

Rules:
- Hook must be irresistible in the first line
- Every sentence must earn its place
- Use short, punchy sentences
- Build tension or curiosity progressively
- End with impact (cliffhanger for series, satisfying payoff for standalone)
- Write for spoken delivery — natural rhythm, pauses, emphasis
- Match the channel's tone and language style exactly`;

export function buildScriptGenerationPrompt(params: {
  channelDNA: string;
  title: string;
  concept: string;
  hook: string;
  genre: string;
  language: string;
  duration: string;
  narrationStyle: string;
  seriesContext?: string;
}): string {
  const { channelDNA, title, concept, hook, genre, language, duration, narrationStyle, seriesContext } = params;

  let prompt = `Write a complete narration script for this ${genre} video.

## Title: ${title}
## Concept: ${concept}
## Hook: ${hook}
## Duration: ${duration}
## Narration Style: ${narrationStyle}
## Language: ${language}

## Channel DNA
${channelDNA}`;

  if (seriesContext) {
    prompt += `\n\n## Series Context
${seriesContext}`;
  }

  prompt += `

## Output Format
Respond ONLY with a JSON object:
{
  "script": {
    "hook": "Opening 2-3 seconds — the irresistible opener",
    "setup": "5-10 seconds — establish the premise",
    "escalation": "10-20 seconds — build tension/curiosity",
    "payoff": "5-10 seconds — the climax or revelation",
    "cliffhanger": "2-5 seconds — the ending hook (null for standalone)"
  },
  "fullNarration": "The complete script as it would be narrated, with (pauses) and *emphasis* marked",
  "estimatedDuration": "Duration in seconds",
  "toneNotes": "Delivery notes for narration",
  "captionSuggestion": "Suggested social media caption",
  "titleOptions": ["Title option 1", "Title option 2", "Title option 3"],
  "ctaSuggestion": "Call-to-action suggestion"
}`;

  return prompt;
}
