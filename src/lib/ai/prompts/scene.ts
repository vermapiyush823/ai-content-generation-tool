/**
 * Scene Breakdown Prompt Template v1
 * Breaks an episode script into individual scenes with detailed visual descriptions.
 */

export const SCENE_SYSTEM_PROMPT = `You are an expert visual director for AI-generated short-form video content.
Your job is to break scripts into individual scenes with precise visual descriptions.

Rules:
- Each scene should be 3-8 seconds
- Visual descriptions must be specific enough for AI video generation
- Maintain character visual consistency across scenes
- Include camera angles, lighting, and environment details
- Include sound design notes
- Transitions between scenes should feel cinematic
- Scene narration must match the script exactly`;

export function buildSceneBreakdownPrompt(params: {
  script: string;
  characters?: string;
  locations?: string;
  visualStyle: string;
  duration: string;
}): string {
  const { script, characters, locations, visualStyle, duration } = params;

  let prompt = `Break this script into individual scenes for AI video generation.

## Script
${script}

## Visual Style: ${visualStyle}
## Total Duration: ${duration}`;

  if (characters) {
    prompt += `\n\n## Character Visual Identities (MAINTAIN CONSISTENCY)
${characters}`;
  }

  if (locations) {
    prompt += `\n\n## Location Visual Details
${locations}`;
  }

  prompt += `

## Output Format
Respond ONLY with a JSON array of scene objects:
[
  {
    "sceneNumber": 1,
    "duration": "5s",
    "narration": "What is being narrated/spoken",
    "dialogue": "Any character dialogue (null if none)",
    "visualDescription": "Detailed description of what's on screen",
    "camera": "Camera angle and movement",
    "lighting": "Lighting setup",
    "environment": "Environment/setting details",
    "characterActions": "What characters are doing",
    "soundDesign": "Sound effects, ambient audio, music cues",
    "transition": "Transition to next scene (cut/fade/dissolve/etc.)"
  }
]`;

  return prompt;
}
