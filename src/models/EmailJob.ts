import mongoose, { Schema, type Document } from 'mongoose';

export interface IEmailJob extends Document {
  packageId?: mongoose.Types.ObjectId;
  channelIds: mongoose.Types.ObjectId[];
  recipient: string;
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'emailed';
  subject?: string;
  error?: string;
  sentAt?: Date;
  retryCount: number;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EmailJobSchema = new Schema<IEmailJob>(
  {
    packageId: { type: Schema.Types.ObjectId, ref: 'DailyContentPackage' },
    channelIds: [{ type: Schema.Types.ObjectId, ref: 'Channel' }],
    recipient: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'generating', 'completed', 'failed', 'emailed'],
      default: 'pending',
    },
    subject: { type: String },
    error: { type: String },
    sentAt: { type: Date },
    retryCount: { type: Number, default: 0 },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  {
    timestamps: true,
  }
);

EmailJobSchema.index({ status: 1, createdAt: -1 });

const EmailJob =
  (mongoose.models.EmailJob as mongoose.Model<IEmailJob>) ||
  mongoose.model<IEmailJob>('EmailJob', EmailJobSchema);

export default EmailJob;
