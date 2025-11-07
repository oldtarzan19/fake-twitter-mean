import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IRetweet {
  tweet: Types.ObjectId;
  user: Types.ObjectId;
  comment?: string;
}

export interface IRetweetDocument extends IRetweet, Document {
  _id: Types.ObjectId;
  createdAt: Date;
}

type RetweetModel = Model<IRetweetDocument>;

const RetweetSchema = new Schema<IRetweetDocument, RetweetModel>(
  {
    tweet: { type: Schema.Types.ObjectId, ref: 'Tweet', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    comment: { type: String, trim: true, maxlength: 280 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

RetweetSchema.index({ tweet: 1, user: 1 }, { unique: true });

export const RetweetModel = model<IRetweetDocument, RetweetModel>('Retweet', RetweetSchema);
