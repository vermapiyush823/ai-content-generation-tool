import mongoose, { Schema, type Document } from 'mongoose';

export interface IContentPerformance extends Document {
  episodeId?: mongoose.Types.ObjectId;
  channelId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  platform: 'youtube_shorts' | 'instagram_reels' | 'tiktok';
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  followersGained: number;
  watchTime?: number; // total in seconds
  averageViewDuration?: number; // in seconds
  averagePercentageViewed?: number; // 0-100%
  completionRate?: number; // 0-100%
  swipeAwayRate?: number; // 0-100%
  videoDuration: number; // in seconds
  publishDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContentPerformanceSchema = new Schema<IContentPerformance>(
  {
    episodeId: { type: Schema.Types.ObjectId, ref: 'Episode', index: true },
    channelId: { type: Schema.Types.ObjectId, ref: 'Channel', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    platform: {
      type: String,
      enum: ['youtube_shorts', 'instagram_reels', 'tiktok'],
      required: true,
      default: 'youtube_shorts',
    },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    followersGained: { type: Number, default: 0 },
    watchTime: { type: Number },
    averageViewDuration: { type: Number },
    averagePercentageViewed: { type: Number },
    completionRate: { type: Number },
    swipeAwayRate: { type: Number },
    videoDuration: { type: Number, default: 30 },
    publishDate: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

ContentPerformanceSchema.index({ channelId: 1, publishDate: -1 });
ContentPerformanceSchema.index({ userId: 1, views: -1 });

const ContentPerformance =
  (mongoose.models.ContentPerformance as mongoose.Model<IContentPerformance>) ||
  mongoose.model<IContentPerformance>('ContentPerformance', ContentPerformanceSchema);

export default ContentPerformance;
