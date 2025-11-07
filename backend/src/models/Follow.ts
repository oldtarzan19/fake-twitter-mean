import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IFollow {
  follower: Types.ObjectId;
  following: Types.ObjectId;
}

export interface IFollowDocument extends IFollow, Document {
  _id: Types.ObjectId;
  createdAt: Date;
}

type FollowModel = Model<IFollowDocument>;

const FollowSchema = new Schema<IFollowDocument, FollowModel>(
  {
    follower: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    following: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

FollowSchema.index({ follower: 1, following: 1 }, { unique: true });

export const FollowModel = model<IFollowDocument, FollowModel>('Follow', FollowSchema);
