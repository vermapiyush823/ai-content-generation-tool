import mongoose, { Schema, type Document } from 'mongoose';

export interface IDailyStrategy {
  objective: string;
  focus: string;
  avoid: string;
  experiment?: string;
  reason: string;
}

export interface IDailyContentPackage extends Document {
  date: string; // YYYY-MM-DD
  channelId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  strategy: IDailyStrategy;
  ideas: any[];
  episodes: mongoose.Types.ObjectId[];
  status: 'generating' | 'completed' | 'failed' | 'emailed';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DailyStrategySchema = new Schema<IDailyStrategy>(
  {
    objective: { type: String, required: true },
    focus: { type: String, required: true },
    avoid: { type: String, default: '' },
    experiment: { type: String, default: '' },
    reason: { type: String, default: '' },
  },
  { _id: false }
);

const DailyContentPackageSchema = new Schema<IDailyContentPackage>(
  {
    date: { type: String, required: true, index: true },
    channelId: { type: Schema.Types.ObjectId, ref: 'Channel', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    strategy: { type: DailyStrategySchema, required: true },
    ideas: [{ type: Schema.Types.Mixed }],
    episodes: [{ type: Schema.Types.ObjectId, ref: 'Episode' }],
    status: {
      type: String,
      enum: ['generating', 'completed', 'failed', 'emailed'],
      default: 'generating',
    },
    error: { type: String },
  },
  {
    timestamps: true,
  }
);

DailyContentPackageSchema.index({ date: 1, channelId: 1 }, { unique: true });

const DailyContentPackage =
  (mongoose.models.DailyContentPackage as mongoose.Model<IDailyContentPackage>) ||
  mongoose.model<IDailyContentPackage>('DailyContentPackage', DailyContentPackageSchema);

export default DailyContentPackage;
