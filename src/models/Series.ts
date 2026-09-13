import mongoose, { Schema, type Document } from 'mongoose';

export interface ICharacter {
  _id?: mongoose.Types.ObjectId;
  name: string;
  age?: string;
  appearance: string;
  clothing?: string;
  personality?: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'narrator';
  relationships?: string[];
  visualIdentity: string;
}

export interface ILocation {
  _id?: mongoose.Types.ObjectId;
  name: string;
  description: string;
  visualIdentity: string;
  importantDetails?: string[];
}

export interface IStoryObject {
  _id?: mongoose.Types.ObjectId;
  name: string;
  description: string;
  importance?: string;
  visualIdentity: string;
}

export interface IStoryState {
  whatHasHappened: string[];
  currentMystery: string;
  knownInformation: string[];
  unknownInformation: string[];
  openThreads: string[];
  resolvedThreads: string[];
  futureClues: string[];
}

export interface IEpisodeOutline {
  episodeNumber: number;
  title: string;
  summary: string;
  keyEvents: string[];
  cliffhanger: string;
}

export interface ISeriesBible {
  worldRules: string[];
  timeline: string;
  storyArc: string;
  episodeOutlines: IEpisodeOutline[];
  storyState: IStoryState;
}

export interface ISeries extends Document {
  title: string;
  concept: string;
  genre: string;
  premise: string;
  theme: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  plannedEpisodes: number;
  currentEpisode: number;
  seriesBible: ISeriesBible;
  characters: ICharacter[];
  locations: ILocation[];
  objects: IStoryObject[];
  channelId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CharacterSchema = new Schema<ICharacter>(
  {
    name: { type: String, required: true, trim: true },
    age: { type: String, default: '' },
    appearance: { type: String, required: true },
    clothing: { type: String, default: '' },
    personality: { type: String, default: '' },
    role: {
      type: String,
      enum: ['protagonist', 'antagonist', 'supporting', 'narrator'],
      default: 'protagonist',
    },
    relationships: [{ type: String }],
    visualIdentity: { type: String, required: true },
  },
  { _id: true }
);

const LocationSchema = new Schema<ILocation>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    visualIdentity: { type: String, required: true },
    importantDetails: [{ type: String }],
  },
  { _id: true }
);

const StoryObjectSchema = new Schema<IStoryObject>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    importance: { type: String, default: '' },
    visualIdentity: { type: String, required: true },
  },
  { _id: true }
);

const SeriesBibleSchema = new Schema<ISeriesBible>(
  {
    worldRules: [{ type: String }],
    timeline: { type: String, default: '' },
    storyArc: { type: String, default: '' },
    episodeOutlines: [
      {
        episodeNumber: { type: Number, required: true },
        title: { type: String, required: true },
        summary: { type: String, default: '' },
        keyEvents: [{ type: String }],
        cliffhanger: { type: String, default: '' },
      },
    ],
    storyState: {
      whatHasHappened: [{ type: String }],
      currentMystery: { type: String, default: '' },
      knownInformation: [{ type: String }],
      unknownInformation: [{ type: String }],
      openThreads: [{ type: String }],
      resolvedThreads: [{ type: String }],
      futureClues: [{ type: String }],
    },
  },
  { _id: false }
);

const SeriesSchema = new Schema<ISeries>(
  {
    title: { type: String, required: true, trim: true },
    concept: { type: String, required: true },
    genre: { type: String, required: true },
    premise: { type: String, default: '' },
    theme: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'active', 'completed', 'archived'],
      default: 'draft',
    },
    plannedEpisodes: { type: Number, default: 5 },
    currentEpisode: { type: Number, default: 1 },
    seriesBible: {
      type: SeriesBibleSchema,
      default: () => ({
        worldRules: [],
        timeline: '',
        storyArc: '',
        episodeOutlines: [],
        storyState: {
          whatHasHappened: [],
          currentMystery: '',
          knownInformation: [],
          unknownInformation: [],
          openThreads: [],
          resolvedThreads: [],
          futureClues: [],
        },
      }),
    },
    characters: [CharacterSchema],
    locations: [LocationSchema],
    objects: [StoryObjectSchema],
    channelId: { type: Schema.Types.ObjectId, ref: 'Channel', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  {
    timestamps: true,
  }
);

SeriesSchema.index({ channelId: 1, status: 1 });
SeriesSchema.index({ userId: 1, status: 1 });

const Series =
  (mongoose.models.Series as mongoose.Model<ISeries>) ||
  mongoose.model<ISeries>('Series', SeriesSchema);

export default Series;
