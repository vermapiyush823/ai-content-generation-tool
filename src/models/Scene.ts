import mongoose, { Schema, type Document } from 'mongoose';

export interface IScenePrompts {
  generic: string;
  gemini: string;
  grok: string;
}

export interface IScene extends Document {
  episodeId: mongoose.Types.ObjectId;
  channelId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  sceneNumber: number;
  duration: number; // in seconds
  narration: string;
  dialogue?: string;
  visualDescription: string;
  camera: string;
  lighting: string;
  environment: string;
  characterActions: string;
  soundDesign: string;
  transition: string;
  prompts: IScenePrompts;
  characterReferences?: string[];
  continuityNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ScenePromptsSchema = new Schema<IScenePrompts>(
  {
    generic: { type: String, default: '' },
    gemini: { type: String, default: '' },
    grok: { type: String, default: '' },
  },
  { _id: false }
);

const SceneSchema = new Schema<IScene>(
  {
    episodeId: { type: Schema.Types.ObjectId, ref: 'Episode', required: true, index: true },
    channelId: { type: Schema.Types.ObjectId, ref: 'Channel', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sceneNumber: { type: Number, required: true },
    duration: { type: Number, required: true, default: 5 },
    narration: { type: String, default: '' },
    dialogue: { type: String, default: '' },
    visualDescription: { type: String, required: true },
    camera: { type: String, default: 'cinematic medium shot' },
    lighting: { type: String, default: 'dramatic lighting' },
    environment: { type: String, default: '' },
    characterActions: { type: String, default: '' },
    soundDesign: { type: String, default: '' },
    transition: { type: String, default: 'cut' },
    prompts: {
      type: ScenePromptsSchema,
      default: () => ({ generic: '', gemini: '', grok: '' }),
    },
    characterReferences: [{ type: String }],
    continuityNotes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

SceneSchema.index({ episodeId: 1, sceneNumber: 1 });

const Scene =
  (mongoose.models.Scene as mongoose.Model<IScene>) ||
  mongoose.model<IScene>('Scene', SceneSchema);

export default Scene;
