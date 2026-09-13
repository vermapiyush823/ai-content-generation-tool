import mongoose, { Schema, type Document } from 'mongoose';

export interface IEmailSettings {
  enabled: boolean;
  time: string; // "08:00"
  timezone: string; // "Asia/Kolkata", "UTC", etc.
  recipientEmail: string;
  channels: mongoose.Types.ObjectId[];
  videosPerChannel: number;
  includeInsights: boolean;
  includeScripts: boolean;
  includePrompts: boolean;
  includeCaptions: boolean;
}

export interface IAiUsage {
  generationsToday: number;
  generationsMonth: number;
  lastResetDate: string; // YYYY-MM-DD
}

export interface ISettings extends Document {
  userId: mongoose.Types.ObjectId;
  emailSettings: IEmailSettings;
  aiUsage: IAiUsage;
  createdAt: Date;
  updatedAt: Date;
}

const EmailSettingsSchema = new Schema<IEmailSettings>(
  {
    enabled: { type: Boolean, default: true },
    time: { type: String, default: '08:00' },
    timezone: { type: String, default: 'UTC' },
    recipientEmail: { type: String, default: '' },
    channels: [{ type: Schema.Types.ObjectId, ref: 'Channel' }],
    videosPerChannel: { type: Number, default: 2, min: 1, max: 10 },
    includeInsights: { type: Boolean, default: true },
    includeScripts: { type: Boolean, default: true },
    includePrompts: { type: Boolean, default: true },
    includeCaptions: { type: Boolean, default: true },
  },
  { _id: false }
);

const AiUsageSchema = new Schema<IAiUsage>(
  {
    generationsToday: { type: Number, default: 0 },
    generationsMonth: { type: Number, default: 0 },
    lastResetDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  },
  { _id: false }
);

const SettingsSchema = new Schema<ISettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    emailSettings: {
      type: EmailSettingsSchema,
      default: () => ({
        enabled: true,
        time: '08:00',
        timezone: 'UTC',
        recipientEmail: '',
        channels: [],
        videosPerChannel: 2,
        includeInsights: true,
        includeScripts: true,
        includePrompts: true,
        includeCaptions: true,
      }),
    },
    aiUsage: {
      type: AiUsageSchema,
      default: () => ({
        generationsToday: 0,
        generationsMonth: 0,
        lastResetDate: new Date().toISOString().split('T')[0],
      }),
    },
  },
  {
    timestamps: true,
  }
);

const Settings =
  (mongoose.models.Settings as mongoose.Model<ISettings>) ||
  mongoose.model<ISettings>('Settings', SettingsSchema);

export default Settings;
