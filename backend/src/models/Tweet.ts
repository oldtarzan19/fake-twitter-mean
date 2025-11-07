import { Document, Model, Schema, Types, model } from 'mongoose';

export interface ITweet {
  author: Types.ObjectId;
  content: string;
  replyTo?: Types.ObjectId | null;
  likesCount: number;
  retweetsCount: number;
  commentsCount: number;
}

export interface ITweetDocument extends ITweet, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

type TweetModel = Model<ITweetDocument>;

const TweetSchema = new Schema<ITweetDocument, TweetModel>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 280 },
    replyTo: { type: Schema.Types.ObjectId, ref: 'Tweet', default: null },
    likesCount: { type: Number, default: 0 },
    retweetsCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

TweetSchema.index({ createdAt: -1 });

export const TweetModel = model<ITweetDocument, TweetModel>('Tweet', TweetSchema);
