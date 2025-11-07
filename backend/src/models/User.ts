import { Document, Model, Schema, Types, model } from 'mongoose';

export type UserRole = 'user' | 'admin';

export interface IUser {
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  bio?: string;
  isSuspended: boolean;
}

export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface IUserModel extends Model<IUserDocument> {}

const UserSchema = new Schema<IUserDocument, IUserModel>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 32,
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user', required: true },
    bio: { type: String, trim: true, maxlength: 280 },
    isSuspended: { type: Boolean, default: false },
  },
  { timestamps: true },
);

UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });

UserSchema.set('toJSON', {
  transform: (_doc, ret: Partial<IUserDocument>) => {
    delete ret.passwordHash;
    return ret;
  },
});

export const UserModel = model<IUserDocument, IUserModel>('User', UserSchema);
