import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler';
import { FollowModel } from '../models/Follow';
import { UserModel } from '../models/User';
import { TweetModel } from '../models/Tweet';
import { badRequest, notFound } from '../utils/httpError';
import { ensureObjectId } from '../utils/objectId';
import { getPagination } from '../utils/pagination';

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const userId = ensureObjectId(req.params.userId);
  const user = await UserModel.findById(userId);
  if (!user) {
    throw notFound('User not found');
  }

  const [followersCount, followingCount, tweetsCount] = await Promise.all([
    FollowModel.countDocuments({ following: user._id }),
    FollowModel.countDocuments({ follower: user._id }),
    TweetModel.countDocuments({ author: user._id }),
  ]);

  let isFollowing = false;
  let isFollower = false;
  let isSelf = false;

  if (req.currentUser) {
    isSelf = req.currentUser._id.equals(user._id);
    if (!isSelf) {
      const [followingRelation, followerRelation] = await Promise.all([
        FollowModel.exists({ follower: req.currentUser._id, following: user._id }),
        FollowModel.exists({ follower: user._id, following: req.currentUser._id }),
      ]);
      isFollowing = Boolean(followingRelation);
      isFollower = Boolean(followerRelation);
    }
  }

  res.json({
    user,
    stats: { followersCount, followingCount, tweetsCount },
    relationship: { isFollowing, isFollower, isSelf },
  });
});

export const getFollowers = asyncHandler(async (req: Request, res: Response) => {
  const userId = ensureObjectId(req.params.userId);
  const user = await UserModel.findById(userId);
  if (!user) {
    throw notFound('User not found');
  }

  const { limit, skip } = getPagination(req);
  const followers = await FollowModel.find({ following: user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('follower', '-passwordHash');

  res.json({
    items: followers.map((f) => f.follower),
    pagination: { limit, skip, count: followers.length },
  });
});

export const getFollowing = asyncHandler(async (req: Request, res: Response) => {
  const userId = ensureObjectId(req.params.userId);
  const user = await UserModel.findById(userId);
  if (!user) {
    throw notFound('User not found');
  }

  const { limit, skip } = getPagination(req);
  const followings = await FollowModel.find({ follower: user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('following', '-passwordHash');

  res.json({
    items: followings.map((f) => f.following),
    pagination: { limit, skip, count: followings.length },
  });
});

export const followUser = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = req.currentUser!;
  const targetUserId = ensureObjectId(req.params.userId);

  if (currentUser._id.equals(targetUserId)) {
    throw badRequest('Cannot follow yourself');
  }

  const targetUser = await UserModel.findById(targetUserId);
  if (!targetUser) {
    throw notFound('User not found');
  }

  try {
    await FollowModel.create({ follower: currentUser._id, following: targetUser._id });
  } catch (error) {
    if (
      error instanceof mongoose.Error.ValidationError ||
      (error instanceof mongoose.mongo.MongoServerError && error.code === 11000)
    ) {
      // Already following is fine
      res.json({ following: true });
      return;
    }
    throw error;
  }

  res.status(201).json({ following: true });
});

export const unfollowUser = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = req.currentUser!;
  const targetUserId = ensureObjectId(req.params.userId);

  const targetUser = await UserModel.findById(targetUserId);
  if (!targetUser) {
    throw notFound('User not found');
  }

  await FollowModel.findOneAndDelete({
    follower: currentUser._id,
    following: targetUser._id,
  });

  res.json({ following: false });
});
