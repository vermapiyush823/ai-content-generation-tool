import mongoose, { Schema, type Document } from 'mongoose';

export interface IExperiment extends Document {
  channelId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  hypothesis: string;
  test: string;
  baseline: string;
  successMetric: string;
  duration: string; // e.g., '5 videos' or '2 weeks'
  status: 'active' | 'completed' | 'abandoned';
  outcome?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExperimentSchema = new Schema<IExperiment>(
  {
    channelId: { type: Schema.Types.ObjectId, ref: 'Channel', index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    hypothesis: { type: String, required: true },
    test: { type: String, required: true },
    baseline: { type: String, default: '' },
    successMetric: { type: String, default: '' },
    duration: { type: String, default: '5 videos' },
    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned'],
      default: 'active',
    },
    outcome: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

ExperimentSchema.index({ userId: 1, status: 1 });

const Experiment =
  (mongoose.models.Experiment as mongoose.Model<IExperiment>) ||
  mongoose.model<IExperiment>('Experiment', ExperimentSchema);

export default Experiment;
