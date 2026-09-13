import type { PromptAdapter, SceneData, CharacterData, AdapterOutput } from './base';

/**
 * Grok (xAI) Prompt Adapter
 * Optimized for Grok/Aurora video generation.
 * Emphasizes action, mood, and character consistency.
 */
export class GrokAdapter implements PromptAdapter {
  modelName = 'Grok';

  formatPrompt(scene: SceneData, characters?: CharacterData[], visualStyle?: string): AdapterOutput {
    const parts: string[] = [];

    // Grok prefers action-oriented descriptions
    // Lead with character actions and visual movement
    if (scene.characterActions) {
      parts.push(scene.characterActions);
    }

    // Main visual
    parts.push(scene.visualDescription);

    // Character consistency (Grok benefits from detailed character descriptions)
    if (characters && characters.length > 0) {
      characters.forEach((c) => {
        parts.push(
          `Character "${c.name}": ${c.visualIdentity || `${c.appearance}, wearing ${c.clothing}`}`
        );
      });
    }

    // Mood and atmosphere (Grok responds well to mood keywords)
    if (scene.soundDesign) {
      parts.push(`Mood: ${scene.soundDesign}`);
    }

    // Environment
    if (scene.environment) {
      parts.push(scene.environment);
    }

    // Camera
    if (scene.camera) {
      parts.push(scene.camera);
    }

    // Lighting
    if (scene.lighting) {
      parts.push(scene.lighting);
    }

    // Style
    if (visualStyle) {
      parts.push(`Style: ${visualStyle}`);
    }

    return {
      prompt: parts.join('. '),
      negativePrompt: 'blurry, distorted, low resolution, watermark, text overlay, static, amateur',
      modelName: this.modelName,
      settings: {
        aspectRatio: '9:16',
        duration: scene.duration,
        style: 'dramatic',
      },
    };
  }
}
