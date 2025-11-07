import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IComment {
  tweet: Types.ObjectId;
  author: Types.ObjectId;
  content: string;
}

export interface ICommentDocument extends IComment, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

type CommentModel = Model<ICommentDocument>;

const CommentSchema = new Schema<ICommentDocument, CommentModel>(
  {
    tweet: { type: Schema.Types.ObjectId, ref: 'Tweet', required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 280 },
  },
  { timestamps: true },
);

CommentSchema.index({ createdAt: -1 });

export const CommentModel = model<ICommentDocument, CommentModel>('Comment', CommentSchema);
