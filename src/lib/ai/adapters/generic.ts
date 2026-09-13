import type { PromptAdapter, SceneData, CharacterData, AdapterOutput } from './base';

/**
 * Generic Prompt Adapter
 * Produces a universal prompt format that works reasonably well with most models.
 */
export class GenericAdapter implements PromptAdapter {
  modelName = 'Generic';

  formatPrompt(scene: SceneData, characters?: CharacterData[], visualStyle?: string): AdapterOutput {
    const parts: string[] = [];

    // Visual description
    parts.push(scene.visualDescription);

    // Character details for consistency
    if (characters && characters.length > 0) {
      const charDescriptions = characters
        .map((c) => `${c.name}: ${c.appearance}, wearing ${c.clothing}`)
        .join('. ');
      parts.push(charDescriptions);
    }

    // Camera and lighting
    parts.push(`${scene.camera}. ${scene.lighting}`);

    // Environment
    if (scene.environment) {
      parts.push(scene.environment);
    }

    // Character actions
    if (scene.characterActions) {
      parts.push(scene.characterActions);
    }

    // Style
    if (visualStyle) {
      parts.push(`Style: ${visualStyle}`);
    }

    return {
      prompt: parts.join('. '),
      modelName: this.modelName,
      settings: {
        aspectRatio: '9:16',
        duration: scene.duration,
      },
    };
  }
}
