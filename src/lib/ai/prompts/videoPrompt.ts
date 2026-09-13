/**
 * Video Prompt Generation Template v1
 * Converts scenes into model-specific prompts for AI video generators.
 */

export const VIDEO_PROMPT_SYSTEM = `You are an expert at writing prompts for AI video generation models.
Your job is to convert scene descriptions into optimized prompts for specific AI video models.

Rules:
- Be extremely specific about visual elements
- Include camera movement, lighting, and atmosphere
- Maintain character consistency using detailed descriptions
- Use the model's preferred prompt syntax
- Keep prompts focused — one clear visual per prompt
- Avoid contradictory instructions`;

export function buildVideoPromptGenerationPrompt(params: {
  scene: {
    visualDescription: string;
    camera: string;
    lighting: string;
    environment: string;
    characterActions: string;
    duration: string;
  };
  characters?: string;
  visualStyle: string;
  targetModel: string;
}): string {
  const { scene, characters, visualStyle, targetModel } = params;

  let prompt = `Generate an optimized ${targetModel} video generation prompt for this scene.

## Scene
Visual: ${scene.visualDescription}
Camera: ${scene.camera}
Lighting: ${scene.lighting}
Environment: ${scene.environment}
Character Actions: ${scene.characterActions}
Duration: ${scene.duration}

## Visual Style: ${visualStyle}`;

  if (characters) {
    prompt += `\n\n## Character Visual Identities
${characters}`;
  }

  prompt += `

## Target Model: ${targetModel}

## Output Format
Respond ONLY with a JSON object:
{
  "prompt": "The complete prompt optimized for ${targetModel}",
  "negativePrompt": "What to avoid (if supported by model)",
  "settings": {
    "aspectRatio": "9:16",
    "duration": "${scene.duration}",
    "style": "Suggested style preset if applicable"
  }
}`;

  return prompt;
}
