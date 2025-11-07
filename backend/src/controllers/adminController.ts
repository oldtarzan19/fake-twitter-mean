import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { UserModel } from '../models/User';
import { badRequest, notFound } from '../utils/httpError';
import { ensureObjectId } from '../utils/objectId';
import { getPagination } from '../utils/pagination';
import { FollowModel } from '../models/Follow';
import { TweetModel } from '../models/Tweet';
import { CommentModel } from '../models/Comment';
import { LikeModel } from '../models/Like';
import { RetweetModel } from '../models/Retweet';

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { limit, skip } = getPagination(req);
  const search = (req.query.search as string | undefined)?.trim();

  const filter = search
    ? {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    UserModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    UserModel.countDocuments(filter),
  ]);

  res.json({
    items,
    pagination: { limit, skip, total },
  });
});

export const updateUserSuspension = asyncHandler(async (req: Request, res: Response) => {
  const userId = ensureObjectId(req.params.userId);
  const { isSuspended } = req.body as { isSuspended?: boolean };

  if (typeof isSuspended !== 'boolean') {
    throw badRequest('isSuspended flag required');
  }

  const user = await UserModel.findByIdAndUpdate(
    userId,
    { isSuspended },
    { new: true, runValidators: true },
  );

  if (!user) {
    throw notFound('User not found');
  }

  res.json({ user });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = ensureObjectId(req.params.userId);
  const user = await UserModel.findById(userId);
  if (!user) {
    throw notFound('User not found');
  }

  await Promise.all([
    UserModel.deleteOne({ _id: user._id }),
    FollowModel.deleteMany({ $or: [{ follower: user._id }, { following: user._id }] }),
    TweetModel.deleteMany({ author: user._id }),
    CommentModel.deleteMany({ author: user._id }),
    LikeModel.deleteMany({ user: user._id }),
    RetweetModel.deleteMany({ user: user._id }),
  ]);

  res.json({ success: true });
});
