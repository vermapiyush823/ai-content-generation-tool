import mongoose, { Schema, type Document } from 'mongoose';

export interface IChannelDNA {
  identity: string;
  audienceProfile: string;
  contentPillars: string[];
  visualIdentity: string;
  narrativeStyle: string;
  competitiveEdge: string;
  growthStrategy: string;
}

export interface IChannel extends Document {
  name: string;
  slug: string;
  platforms: ('youtube_shorts' | 'instagram_reels' | 'tiktok')[];
  genre: string;
  subgenre?: string;
  language: string;
  audience: string;
  ageRange: string;
  geography: string;
  tone: string;
  narrationStyle: string;
  visualStyle: string;
  videoLength: string;
  contentFrequency: string;
  seriesPreference: 'standalone' | 'series' | 'mixed';
  hookStyle: string;
  endingStyle: string;
  ctaStyle: string;
  contentRules: string[];
  forbiddenTopics: string[];
  active: boolean;
  channelDNA: IChannelDNA;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ChannelDNASchema = new Schema<IChannelDNA>(
  {
    identity: { type: String, default: '' },
    audienceProfile: { type: String, default: '' },
    contentPillars: [{ type: String }],
    visualIdentity: { type: String, default: '' },
    narrativeStyle: { type: String, default: '' },
    competitiveEdge: { type: String, default: '' },
    growthStrategy: { type: String, default: '' },
  },
  { _id: false }
);

const ChannelSchema = new Schema<IChannel>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    platforms: [{
      type: String,
      enum: ['youtube_shorts', 'instagram_reels', 'tiktok'],
    }],
    genre: { type: String, required: true },
    subgenre: { type: String },
    language: { type: String, required: true, default: 'English' },
    audience: { type: String, default: '' },
    ageRange: { type: String, default: '18-35' },
    geography: { type: String, default: 'Global' },
    tone: { type: String, default: '' },
    narrationStyle: { type: String, default: '' },
    visualStyle: { type: String, default: '' },
    videoLength: { type: String, default: '25-60 seconds' },
    contentFrequency: { type: String, default: 'Daily' },
    seriesPreference: {
      type: String,
      enum: ['standalone', 'series', 'mixed'],
      default: 'mixed',
    },
    hookStyle: { type: String, default: '' },
    endingStyle: { type: String, default: '' },
    ctaStyle: { type: String, default: '' },
    contentRules: [{ type: String }],
    forbiddenTopics: [{ type: String }],
    active: { type: Boolean, default: true },
    channelDNA: { type: ChannelDNASchema, default: () => ({}) },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for frequent queries
ChannelSchema.index({ userId: 1, active: 1 });
ChannelSchema.index({ userId: 1, genre: 1 });

const Channel =
  (mongoose.models.Channel as mongoose.Model<IChannel>) ||
  mongoose.model<IChannel>('Channel', ChannelSchema);

export default Channel;
