import { User } from './user';

export interface Tweet {
  _id: string;
  author: User | null;
  content: string;
  replyTo?: string | null;
  likesCount: number;
  retweetsCount: number;
  commentsCount: number;
  liked: boolean;
  retweeted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  tweet: string;
  author: User | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}
