import { Document, Model, Schema, Types, model } from 'mongoose';

export interface ILike {
  tweet: Types.ObjectId;
  user: Types.ObjectId;
}

export interface ILikeDocument extends ILike, Document {
  _id: Types.ObjectId;
  createdAt: Date;
}

type LikeModel = Model<ILikeDocument>;

const LikeSchema = new Schema<ILikeDocument, LikeModel>(
  {
    tweet: { type: Schema.Types.ObjectId, ref: 'Tweet', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

LikeSchema.index({ tweet: 1, user: 1 }, { unique: true });

export const LikeModel = model<ILikeDocument, LikeModel>('Like', LikeSchema);
