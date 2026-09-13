/**
 * Continuity Check Prompt Template v1
 * Validates continuity across episodes in a series.
 */

export const CONTINUITY_SYSTEM_PROMPT = `You are an expert continuity checker for serialized short-form video content.
Your job is to verify that new content maintains consistency with established canon.

Check for:
- Character consistency (appearance, personality, knowledge)
- Location consistency (descriptions, details)
- Timeline consistency (events in proper order)
- Plot consistency (no contradictions with established story)
- World-rule consistency (established rules are followed)
- Open thread tracking (unresolved story elements)`;

export function buildContinuityCheckPrompt(params: {
  seriesBible: string;
  previousEpisodes: string;
  newContent: string;
  characters: string;
  locations: string;
}): string {
  const { seriesBible, previousEpisodes, newContent, characters, locations } = params;

  return `Check the following new content for continuity issues.

## Series Bible
${seriesBible}

## Characters
${characters}

## Locations
${locations}

## Previous Episodes
${previousEpisodes}

## New Content to Check
${newContent}

## Output Format
Respond ONLY with a JSON object:
{
  "continuityScore": 1-10,
  "issues": [
    {
      "type": "character | location | timeline | plot | worldRule",
      "severity": "critical | warning | minor",
      "description": "What the issue is",
      "reference": "What established content it contradicts",
      "suggestion": "How to fix it"
    }
  ],
  "openThreads": [
    {
      "thread": "Description of unresolved story element",
      "introducedIn": "Episode number",
      "status": "open | partially_resolved | resolved"
    }
  ],
  "summary": "Overall continuity assessment"
}`;
}
