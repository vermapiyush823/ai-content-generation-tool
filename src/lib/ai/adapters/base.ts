/**
 * Prompt Adapter Interface
 * Each video generation model gets its own adapter for optimal prompt formatting.
 */

export interface SceneData {
  sceneNumber: number;
  duration: string;
  narration: string;
  dialogue: string | null;
  visualDescription: string;
  camera: string;
  lighting: string;
  environment: string;
  characterActions: string;
  soundDesign: string;
  transition: string;
}

export interface CharacterData {
  name: string;
  appearance: string;
  clothing: string;
  visualIdentity: string;
}

export interface AdapterOutput {
  prompt: string;
  negativePrompt?: string;
  modelName: string;
  settings?: Record<string, string>;
}

export interface PromptAdapter {
  modelName: string;
  formatPrompt(scene: SceneData, characters?: CharacterData[], visualStyle?: string): AdapterOutput;
}
