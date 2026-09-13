import mongoose, { Schema, type Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash?: string;
  name: string;
  googleId?: string;
  avatar?: string;
  provider: 'email' | 'google';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    avatar: {
      type: String,
    },
    provider: {
      type: String,
      enum: ['email', 'google'],
      default: 'email',
    },
  },
  {
    timestamps: true,
  }
);

// Validation handled in auth routes instead of pre hook
// UserSchema.pre('validate', function (next: (err?: Error) => void) {
//   const doc = this as { provider: string; passwordHash?: string; invalidate: (path: string, msg: string) => void };
//   if (doc.provider === 'email' && !doc.passwordHash) {
//     doc.invalidate('passwordHash', 'Password is required for email accounts');
//   }
//   next();
// });

// Avoid re-compiling the model during hot reload
const User =
  (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>('User', UserSchema);

export default User;
