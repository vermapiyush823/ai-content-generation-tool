import mongoose, { Schema, type Document } from 'mongoose';

export interface IContentIdea extends Document {
  title: string;
  concept: string;
  hook: string;
  genre: string;
  format: 'standalone' | 'series_potential' | 'sequel';
  seriesPotential: boolean;
  visualPotential: number;
  noveltyScore: number;
  retentionPotential: number;
  productionDifficulty: number;
  overallScore: number;
  reasoning: string;
  status: 'draft' | 'approved' | 'rejected' | 'used';
  channelId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ContentIdeaSchema = new Schema<IContentIdea>(
  {
    title: { type: String, required: true, trim: true },
    concept: { type: String, required: true },
    hook: { type: String, required: true },
    genre: { type: String, required: true },
    format: {
      type: String,
      enum: ['standalone', 'series_potential', 'sequel'],
      default: 'standalone',
    },
    seriesPotential: { type: Boolean, default: false },
    visualPotential: { type: Number, min: 1, max: 10, default: 5 },
    noveltyScore: { type: Number, min: 1, max: 10, default: 5 },
    retentionPotential: { type: Number, min: 1, max: 10, default: 5 },
    productionDifficulty: { type: Number, min: 1, max: 10, default: 5 },
    overallScore: { type: Number, min: 1, max: 10, default: 5 },
    reasoning: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'approved', 'rejected', 'used'],
      default: 'draft',
    },
    channelId: { type: Schema.Types.ObjectId, ref: 'Channel', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  {
    timestamps: true,
  }
);

ContentIdeaSchema.index({ channelId: 1, status: 1 });
ContentIdeaSchema.index({ channelId: 1, createdAt: -1 });

const ContentIdea =
  (mongoose.models.ContentIdea as mongoose.Model<IContentIdea>) ||
  mongoose.model<IContentIdea>('ContentIdea', ContentIdeaSchema);

export default ContentIdea;
