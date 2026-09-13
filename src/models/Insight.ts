import mongoose, { Schema, type Document } from 'mongoose';

export interface IInsight extends Document {
  channelId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  category: 'hook' | 'duration' | 'format' | 'pacing' | 'character' | 'visual' | 'audience';
  observation: string;
  evidence: string;
  confidence: 'high' | 'medium' | 'low';
  recommendation: string;
  sampleSize?: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InsightSchema = new Schema<IInsight>(
  {
    channelId: { type: Schema.Types.ObjectId, ref: 'Channel', index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: {
      type: String,
      enum: ['hook', 'duration', 'format', 'pacing', 'character', 'visual', 'audience'],
      required: true,
      default: 'hook',
    },
    observation: { type: String, required: true },
    evidence: { type: String, required: true },
    confidence: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    recommendation: { type: String, required: true },
    sampleSize: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

InsightSchema.index({ userId: 1, active: 1 });
InsightSchema.index({ channelId: 1, createdAt: -1 });

const Insight =
  (mongoose.models.Insight as mongoose.Model<IInsight>) ||
  mongoose.model<IInsight>('Insight', InsightSchema);

export default Insight;
