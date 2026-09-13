import { PromptAdapter, SceneData, CharacterData, AdapterOutput } from './base';
import { GenericAdapter } from './generic';
import { GeminiAdapter } from './gemini';
import { GrokAdapter } from './grok';

export * from './base';
export * from './generic';
export * from './gemini';
export * from './grok';

const adapters: Record<string, PromptAdapter> = {
  generic: new GenericAdapter(),
  gemini: new GeminiAdapter(),
  grok: new GrokAdapter(),
};

export function getPromptAdapter(model: string): PromptAdapter {
  const normalized = model.toLowerCase();
  return adapters[normalized] || adapters.generic;
}

export function generateAllPrompts(
  scene: SceneData,
  characters?: CharacterData[],
  visualStyle?: string
): { generic: AdapterOutput; gemini: AdapterOutput; grok: AdapterOutput } {
  return {
    generic: adapters.generic.formatPrompt(scene, characters, visualStyle),
    gemini: adapters.gemini.formatPrompt(scene, characters, visualStyle),
    grok: adapters.grok.formatPrompt(scene, characters, visualStyle),
  };
}
