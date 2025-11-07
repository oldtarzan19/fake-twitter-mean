import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { TweetModel } from '../models/Tweet';
import { CommentModel } from '../models/Comment';
import { ensureObjectId } from '../utils/objectId';
import { badRequest, forbidden, notFound } from '../utils/httpError';
import { getPagination } from '../utils/pagination';

export const listComments = asyncHandler(async (req: Request, res: Response) => {
  const tweetId = ensureObjectId(req.params.tweetId);
  const tweet = await TweetModel.findById(tweetId);
  if (!tweet) {
    throw notFound('Tweet not found');
  }

  const { limit, skip } = getPagination(req);

  const comments = await CommentModel.find({ tweet: tweet._id })
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .populate('author', '-passwordHash');

  res.json({
    items: comments,
    pagination: { limit, skip, count: comments.length },
  });
});

export const createComment = asyncHandler(async (req: Request, res: Response) => {
  const tweetId = ensureObjectId(req.params.tweetId);
  const tweet = await TweetModel.findById(tweetId);
  if (!tweet) {
    throw notFound('Tweet not found');
  }

  const currentUser = req.currentUser!;
  const { content } = req.body;

  if (!content || !content.trim()) {
    throw badRequest('Comment cannot be empty');
  }

  const comment = await CommentModel.create({
    tweet: tweet._id,
    author: currentUser._id,
    content: content.trim(),
  });

  await TweetModel.updateOne(
    { _id: tweet._id },
    { $inc: { commentsCount: 1 } },
    { timestamps: false },
  );

  const populated = await comment.populate('author', '-passwordHash');

  res.status(201).json({ comment: populated });
});

export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  const commentId = ensureObjectId(req.params.commentId);
  const comment = await CommentModel.findById(commentId);
  if (!comment) {
    throw notFound('Comment not found');
  }

  const tweet = await TweetModel.findById(comment.tweet);
  if (!tweet) {
    throw notFound('Tweet not found');
  }

  const currentUser = req.currentUser!;
  const isOwner = comment.author.equals(currentUser._id);
  const isAdmin = currentUser.role === 'admin';
  const isTweetOwner = tweet.author.equals(currentUser._id);

  if (!isOwner && !isAdmin && !isTweetOwner) {
    throw forbidden('You cannot delete this comment');
  }

  await CommentModel.deleteOne({ _id: comment._id });
  await TweetModel.updateOne(
    { _id: tweet._id },
    { $inc: { commentsCount: -1 } },
    { timestamps: false },
  );

  res.json({ success: true });
});
