/* eslint-disable no-console */
import mongoose from 'mongoose';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { UserModel } from './models/User';
import { hashPassword } from './utils/password';
import { TweetModel } from './models/Tweet';
import { CommentModel } from './models/Comment';
import { FollowModel } from './models/Follow';
import { LikeModel } from './models/Like';
import { RetweetModel } from './models/Retweet';

const seed = async () => {
  await connectDatabase();

  console.log(`Seeding database ${env.mongoUri}`);

  await Promise.all([
    UserModel.deleteMany({}),
    TweetModel.deleteMany({}),
    CommentModel.deleteMany({}),
    FollowModel.deleteMany({}),
    LikeModel.deleteMany({}),
    RetweetModel.deleteMany({}),
  ]);

  const [admin, alice, bob] = await Promise.all([
    UserModel.create({
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: await hashPassword('AdminPass123'),
      role: 'admin',
      bio: 'Admin of Fake Twitter',
    }),
    UserModel.create({
      username: 'alice',
      email: 'alice@example.com',
      passwordHash: await hashPassword('Password123'),
      role: 'user',
      bio: 'Frontend developer who loves Angular.',
    }),
    UserModel.create({
      username: 'bob',
      email: 'bob@example.com',
      passwordHash: await hashPassword('Password123'),
      role: 'user',
      bio: 'Backend engineer and coffee enthusiast.',
    }),
  ]);

  const tweets = await TweetModel.insertMany([
    {
      author: alice._id,
      content: 'Excited to join Fake Twitter! #hello',
      likesCount: 0,
      retweetsCount: 0,
      commentsCount: 0,
    },
    {
      author: bob._id,
      content: 'Just deployed a new Express API in record time.',
      likesCount: 0,
      retweetsCount: 0,
      commentsCount: 0,
    },
    {
      author: alice._id,
      content: 'Angular signals are game changers!',
      likesCount: 0,
      retweetsCount: 0,
      commentsCount: 0,
    },
  ]);

  const [aliceIntro, bobApi, aliceSignals] = tweets;

  await FollowModel.insertMany([
    { follower: alice._id, following: bob._id },
    { follower: bob._id, following: alice._id },
    { follower: admin._id, following: alice._id },
    { follower: admin._id, following: bob._id },
  ]);

  await CommentModel.insertMany([
    {
      tweet: aliceIntro._id,
      author: bob._id,
      content: 'Welcome Alice! 🎉',
    },
    {
      tweet: bobApi._id,
      author: alice._id,
      content: 'Congrats! Ship it!',
    },
  ]);

  await LikeModel.insertMany([
    { tweet: aliceIntro._id, user: bob._id },
    { tweet: bobApi._id, user: alice._id },
    { tweet: bobApi._id, user: admin._id },
    { tweet: aliceSignals._id, user: bob._id },
  ]);

  await RetweetModel.insertMany([
    { tweet: aliceIntro._id, user: admin._id, comment: 'Give a warm welcome to Alice!' },
    { tweet: bobApi._id, user: admin._id },
  ]);

  await Promise.all(
    [aliceIntro, bobApi, aliceSignals].map(async (tweet) => {
      const [likesCount, retweetsCount, commentsCount] = await Promise.all([
        LikeModel.countDocuments({ tweet: tweet._id }),
        RetweetModel.countDocuments({ tweet: tweet._id }),
        CommentModel.countDocuments({ tweet: tweet._id }),
      ]);

      tweet.likesCount = likesCount;
      tweet.retweetsCount = retweetsCount;
      tweet.commentsCount = commentsCount;
      await tweet.save();
    }),
  );

  console.log('Seed completed successfully.');
  await mongoose.connection.close();
};

seed().catch((error) => {
  console.error('Seed failed', error);
  process.exit(1);
});
