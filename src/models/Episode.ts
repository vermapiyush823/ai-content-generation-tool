import mongoose, { Schema, type Document } from 'mongoose';

export interface IScriptSection {
  hook: string;
  setup: string;
  escalation: string;
  payoff: string;
  cliffhangerOrCta: string;
}

export interface IEpisode extends Document {
  episodeNumber: number;
  title: string;
  hook: string;
  objective: string;
  script: string;
  scriptStructure?: IScriptSection;
  duration: number; // in seconds
  ending: string;
  cliffhanger: string;
  status: 'draft' | 'script_ready' | 'prompts_ready' | 'approved' | 'generated' | 'published';
  seriesId?: mongoose.Types.ObjectId;
  channelId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  qualityScore?: number;
  continuityScore?: number;
  warnings?: string[];
  caption?: string;
  hashtags?: string[];
  cta?: string;
  sceneCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ScriptSectionSchema = new Schema<IScriptSection>(
  {
    hook: { type: String, default: '' },
    setup: { type: String, default: '' },
    escalation: { type: String, default: '' },
    payoff: { type: String, default: '' },
    cliffhangerOrCta: { type: String, default: '' },
  },
  { _id: false }
);

const EpisodeSchema = new Schema<IEpisode>(
  {
    episodeNumber: { type: Number, required: true, default: 1 },
    title: { type: String, required: true, trim: true },
    hook: { type: String, required: true },
    objective: { type: String, default: '' },
    script: { type: String, required: true },
    scriptStructure: { type: ScriptSectionSchema },
    duration: { type: Number, default: 30 },
    ending: { type: String, default: '' },
    cliffhanger: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'script_ready', 'prompts_ready', 'approved', 'generated', 'published'],
      default: 'draft',
    },
    seriesId: { type: Schema.Types.ObjectId, ref: 'Series', index: true },
    channelId: { type: Schema.Types.ObjectId, ref: 'Channel', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    qualityScore: { type: Number, min: 0, max: 100 },
    continuityScore: { type: Number, min: 0, max: 100 },
    warnings: [{ type: String }],
    caption: { type: String, default: '' },
    hashtags: [{ type: String }],
    cta: { type: String, default: '' },
    sceneCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

EpisodeSchema.index({ channelId: 1, status: 1 });
EpisodeSchema.index({ seriesId: 1, episodeNumber: 1 });
EpisodeSchema.index({ userId: 1, createdAt: -1 });

const Episode =
  (mongoose.models.Episode as mongoose.Model<IEpisode>) ||
  mongoose.model<IEpisode>('Episode', EpisodeSchema);

export default Episode;
