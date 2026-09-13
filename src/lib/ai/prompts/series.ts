/**
 * Series Generation Prompt Template v1
 * Creates multi-episode series with bible, characters, and story arcs.
 */

export const SERIES_SYSTEM_PROMPT = `You are an expert serialized content creator specializing in short-form video series.
Your job is to create compelling multi-episode story arcs that keep viewers returning.

Rules:
- Every series must have a strong premise that can sustain multiple episodes
- Characters must be distinctive and memorable in brief screen time
- Each episode must end with a hook or cliffhanger
- Plan story beats across the full series arc
- Ensure each episode can stand alone while contributing to the larger story
- Respect the channel's DNA and content rules
- Create strong visual identities for characters and locations
- Think in terms of 25-90 second episodes`;

export function buildSeriesCreationPrompt(params: {
  channelDNA: string;
  ideaTitle: string;
  ideaConcept: string;
  plannedEpisodes: number;
  genre: string;
  language: string;
}): string {
  const { channelDNA, ideaTitle, ideaConcept, plannedEpisodes, genre, language } = params;

  return `Create a ${plannedEpisodes}-episode ${genre} series based on this idea.

## Idea
Title: ${ideaTitle}
Concept: ${ideaConcept}

## Channel DNA
${channelDNA}

## Language: ${language}

## Output Format
Respond ONLY with a JSON object:
{
  "title": "Series title",
  "concept": "Series concept (2-3 sentences)",
  "premise": "Detailed premise",
  "theme": "Core theme",
  "plannedEpisodes": ${plannedEpisodes},
  "seriesBible": {
    "worldRules": ["Rule 1", "Rule 2"],
    "storyArc": "Overall arc description",
    "episodeOutlines": [
      {
        "episodeNumber": 1,
        "title": "Episode title",
        "summary": "Brief summary",
        "keyEvents": ["Event 1", "Event 2"],
        "cliffhanger": "Episode ending hook"
      }
    ],
    "openThreads": ["Thread that needs resolution"],
    "timeline": "Timeline description"
  },
  "characters": [
    {
      "name": "Character name",
      "age": "Approximate age",
      "appearance": "Physical description for visual consistency",
      "clothing": "Typical clothing/look",
      "personality": "Core personality traits",
      "role": "protagonist | antagonist | supporting",
      "relationships": ["Relationship descriptions"],
      "visualIdentity": "Key visual markers for AI image/video generation"
    }
  ],
  "locations": [
    {
      "name": "Location name",
      "description": "Physical description",
      "visualIdentity": "Key visual details for consistency",
      "importantDetails": ["Detail 1", "Detail 2"]
    }
  ]
}`;
}
