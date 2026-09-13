import type { PromptAdapter, SceneData, CharacterData, AdapterOutput } from './base';

/**
 * Gemini (Veo) Prompt Adapter
 * Optimized for Google's Gemini/Veo video generation.
 * Emphasizes visual description, camera movement, and lighting.
 */
export class GeminiAdapter implements PromptAdapter {
  modelName = 'Gemini';

  formatPrompt(scene: SceneData, characters?: CharacterData[], visualStyle?: string): AdapterOutput {
    const parts: string[] = [];

    // Gemini/Veo prefers clear, structured visual descriptions
    // Lead with the main visual action
    parts.push(scene.visualDescription);

    // Camera movement (Gemini responds well to specific camera directions)
    if (scene.camera) {
      parts.push(`Camera: ${scene.camera}`);
    }

    // Lighting (important for mood in Gemini)
    if (scene.lighting) {
      parts.push(`Lighting: ${scene.lighting}`);
    }

    // Environment context
    if (scene.environment) {
      parts.push(`Setting: ${scene.environment}`);
    }

    // Character details for visual consistency
    if (characters && characters.length > 0) {
      characters.forEach((c) => {
        parts.push(`${c.name}: ${c.visualIdentity || c.appearance}, ${c.clothing}`);
      });
    }

    // Actions
    if (scene.characterActions) {
      parts.push(`Action: ${scene.characterActions}`);
    }

    // Atmosphere/style
    if (visualStyle) {
      parts.push(`Aesthetic: ${visualStyle}`);
    }

    // Mood from sound design
    if (scene.soundDesign) {
      parts.push(`Atmosphere: ${scene.soundDesign}`);
    }

    return {
      prompt: parts.join('. '),
      negativePrompt: 'blurry, low quality, distorted faces, text watermark, logo, static image, slideshow',
      modelName: this.modelName,
      settings: {
        aspectRatio: '9:16',
        duration: scene.duration,
        style: 'cinematic',
      },
    };
  }
}
