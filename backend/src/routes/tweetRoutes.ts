import { Router } from 'express';
import { z } from 'zod';
import {
  createTweet,
  deleteTweet,
  getTweet,
  likeTweet,
  listTweets,
  retweet,
  unretweet,
  unlikeTweet,
} from '../controllers/tweetController';
import {
  createComment,
  deleteComment,
  listComments,
} from '../controllers/commentController';
import { validate } from '../middleware/validate';
import { attachOptionalUser, requireActiveUser, requireAuth } from '../middleware/auth';

const router = Router();

const createTweetSchema = z.object({
  content: z.string().trim().min(1).max(280),
  replyTo: z.string().optional(),
});

const retweetSchema = z.object({
  comment: z.string().trim().min(1).max(280).optional(),
});

const commentSchema = z.object({
  content: z.string().trim().min(1).max(280),
});

router.use(attachOptionalUser);

router.get('/', listTweets);
router.get('/:tweetId', getTweet);
router.get('/:tweetId/comments', listComments);

router.post('/', requireActiveUser, validate(createTweetSchema), createTweet);
router.delete('/:tweetId', requireAuth, deleteTweet);

router.post('/:tweetId/like', requireActiveUser, likeTweet);
router.delete('/:tweetId/like', requireActiveUser, unlikeTweet);

router.post('/:tweetId/retweet', requireActiveUser, validate(retweetSchema), retweet);
router.delete('/:tweetId/retweet', requireActiveUser, unretweet);

router.post('/:tweetId/comments', requireActiveUser, validate(commentSchema), createComment);
router.delete('/comments/:commentId', requireAuth, deleteComment);

export default router;
