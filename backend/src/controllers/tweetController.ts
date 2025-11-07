import { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler';
import { ITweetDocument, TweetModel } from '../models/Tweet';
import { FollowModel } from '../models/Follow';
import { LikeModel } from '../models/Like';
import { RetweetModel } from '../models/Retweet';
import { CommentModel } from '../models/Comment';
import { UserModel } from '../models/User';
import { badRequest, forbidden, notFound, unauthorized } from '../utils/httpError';
import { ensureObjectId } from '../utils/objectId';
import { getPagination } from '../utils/pagination';

const buildTweetResponse = async (
  tweets: ITweetDocument[],
  currentUserId?: Types.ObjectId,
) => {
  const tweetIds = tweets.map((tweet) => tweet._id);
  let likedTweetIds = new Set<string>();
  let retweetedTweetIds = new Set<string>();

  if (currentUserId && tweetIds.length > 0) {
    const [likes, retweets] = await Promise.all([
      LikeModel.find({ user: currentUserId, tweet: { $in: tweetIds } }).lean(),
      RetweetModel.find({ user: currentUserId, tweet: { $in: tweetIds } }).lean(),
    ]);
    likedTweetIds = new Set(likes.map((like) => like.tweet.toString()));
    retweetedTweetIds = new Set(retweets.map((retweet) => retweet.tweet.toString()));
  }

  return tweets.map((tweet) => ({
    ...tweet.toJSON(),
    liked: likedTweetIds.has(tweet._id.toString()),
    retweeted: retweetedTweetIds.has(tweet._id.toString()),
  }));
};

export const listTweets = asyncHandler(async (req: Request, res: Response) => {
  const { limit, skip } = getPagination(req);
  const scope = (req.query.scope as string) ?? 'global';
  const userId = req.query.userId as string | undefined;
  const filter: mongoose.FilterQuery<ITweetDocument> = {};

  if (scope === 'following') {
    if (!req.currentUser) {
      throw unauthorized('Authentication required');
    }
    const followings = await FollowModel.find({ follower: req.currentUser._id }).select(
      'following',
    );
    const followedIds = followings.map((follow) => follow.following);
    filter.author = { $in: [...followedIds, req.currentUser._id] };
  } else if (scope === 'user') {
    if (!userId) {
      throw badRequest('userId query parameter required');
    }
    const targetUserId = ensureObjectId(userId);
    const userExists = await UserModel.exists({ _id: targetUserId });
    if (!userExists) {
      throw notFound('User not found');
    }
    filter.author = targetUserId;
  }

  const tweets = (await TweetModel.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', '-passwordHash')
    .exec()) as ITweetDocument[];

  const items = await buildTweetResponse(tweets, req.currentUser?._id);

  res.json({
    items,
    pagination: { limit, skip, count: items.length },
  });
});

export const createTweet = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = req.currentUser!;
  const { content, replyTo } = req.body;

  let replyToId: mongoose.Types.ObjectId | null = null;
  if (replyTo) {
    replyToId = ensureObjectId(replyTo);
    const parent = await TweetModel.findById(replyToId);
    if (!parent) {
      throw badRequest('Reply target not found');
    }
  }

  const tweet = await TweetModel.create({
    author: currentUser._id,
    content: content.trim(),
    replyTo: replyToId,
  });

  if (replyToId) {
    await TweetModel.findByIdAndUpdate(replyToId, { $inc: { commentsCount: 1 } });
  }

  const populated = await tweet.populate('author', '-passwordHash');

  res.status(201).json({
    tweet: {
      ...populated.toJSON(),
      liked: false,
      retweeted: false,
    },
  });
});

export const getTweet = asyncHandler(async (req: Request, res: Response) => {
  const tweetId = ensureObjectId(req.params.tweetId);
  const tweet = await TweetModel.findById(tweetId).populate('author', '-passwordHash');
  if (!tweet) {
    throw notFound('Tweet not found');
  }

  const [liked, retweeted] = await Promise.all([
    req.currentUser
      ? LikeModel.exists({ tweet: tweet._id, user: req.currentUser._id })
      : Promise.resolve(false),
    req.currentUser
      ? RetweetModel.exists({ tweet: tweet._id, user: req.currentUser._id })
      : Promise.resolve(false),
  ]);

  res.json({
    tweet: {
      ...tweet.toJSON(),
      liked: Boolean(liked),
      retweeted: Boolean(retweeted),
    },
  });
});

export const deleteTweet = asyncHandler(async (req: Request, res: Response) => {
  const tweetId = ensureObjectId(req.params.tweetId);
  const tweet = await TweetModel.findById(tweetId);
  if (!tweet) {
    throw notFound('Tweet not found');
  }

  const currentUser = req.currentUser!;
  const isOwner = tweet.author.equals(currentUser._id);
  const isAdmin = currentUser.role === 'admin';
  if (!isOwner && !isAdmin) {
    throw forbidden('You cannot delete this tweet');
  }

  await Promise.all([
    TweetModel.deleteOne({ _id: tweet._id }),
    CommentModel.deleteMany({ tweet: tweet._id }),
    LikeModel.deleteMany({ tweet: tweet._id }),
    RetweetModel.deleteMany({ tweet: tweet._id }),
  ]);

  if (tweet.replyTo) {
    await TweetModel.findByIdAndUpdate(tweet.replyTo, { $inc: { commentsCount: -1 } });
  }

  res.json({ success: true });
});

export const likeTweet = asyncHandler(async (req: Request, res: Response) => {
  const tweetId = ensureObjectId(req.params.tweetId);
  const tweet = await TweetModel.findById(tweetId);
  if (!tweet) throw notFound('Tweet not found');

  const currentUser = req.currentUser!;

  const existing = await LikeModel.findOne({ tweet: tweet._id, user: currentUser._id });
  if (existing) {
    res.json({ liked: true });
    return;
  }

  try {
    await LikeModel.create({ tweet: tweet._id, user: currentUser._id });
    await TweetModel.updateOne({ _id: tweet._id }, { $inc: { likesCount: 1 } });
  } catch (error) {
    if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) {
      res.json({ liked: true });
      return;
    }
    throw error;
  }

  res.status(201).json({ liked: true });
});

export const unlikeTweet = asyncHandler(async (req: Request, res: Response) => {
  const tweetId = ensureObjectId(req.params.tweetId);
  const tweet = await TweetModel.findById(tweetId);
  if (!tweet) throw notFound('Tweet not found');

  const currentUser = req.currentUser!;

  const result = await LikeModel.findOneAndDelete({ tweet: tweet._id, user: currentUser._id });
  if (result) {
    await TweetModel.updateOne(
      { _id: tweet._id },
      { $inc: { likesCount: -1 } },
      { timestamps: false },
    );
  }

  res.json({ liked: false });
});

export const retweet = asyncHandler(async (req: Request, res: Response) => {
  const tweetId = ensureObjectId(req.params.tweetId);
  const tweet = await TweetModel.findById(tweetId);
  if (!tweet) throw notFound('Tweet not found');

  const currentUser = req.currentUser!;
  const { comment } = req.body;

  const existing = await RetweetModel.findOne({ tweet: tweet._id, user: currentUser._id });
  if (existing) {
    res.json({ retweeted: true });
    return;
  }

  await RetweetModel.create({ tweet: tweet._id, user: currentUser._id, comment });
  await TweetModel.updateOne({ _id: tweet._id }, { $inc: { retweetsCount: 1 } });

  res.status(201).json({ retweeted: true });
});

export const unretweet = asyncHandler(async (req: Request, res: Response) => {
  const tweetId = ensureObjectId(req.params.tweetId);
  const tweet = await TweetModel.findById(tweetId);
  if (!tweet) throw notFound('Tweet not found');

  const currentUser = req.currentUser!;

  const result = await RetweetModel.findOneAndDelete({ tweet: tweet._id, user: currentUser._id });
  if (result) {
    await TweetModel.updateOne(
      { _id: tweet._id },
      { $inc: { retweetsCount: -1 } },
      { timestamps: false },
    );
  }

  res.json({ retweeted: false });
});
