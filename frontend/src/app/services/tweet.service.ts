import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PaginatedResponse } from '../models/pagination';
import { Comment, Tweet } from '../models/tweet';

interface CreateTweetPayload {
  content: string;
  replyTo?: string;
}

interface RetweetPayload {
  comment?: string;
}

export interface TweetListFilters {
  scope?: 'global' | 'following' | 'user';
  userId?: string;
  limit?: number;
  skip?: number;
}

@Injectable({
  providedIn: 'root',
})
export class TweetService {
  constructor(private readonly api: ApiService) {}

  listTweets(filters: TweetListFilters): Observable<PaginatedResponse<Tweet>> {
    const params = new URLSearchParams();
    if (filters.scope) {
      params.set('scope', filters.scope);
    }
    if (filters.userId) {
      params.set('userId', filters.userId);
    }
    if (typeof filters.limit === 'number') {
      params.set('limit', String(filters.limit));
    }
    if (typeof filters.skip === 'number') {
      params.set('skip', String(filters.skip));
    }

    const query = params.toString();
    return this.api.get<PaginatedResponse<Tweet>>(`/tweets${query ? `?${query}` : ''}`);
  }

  getTweet(tweetId: string): Observable<{ tweet: Tweet }> {
    return this.api.get(`/tweets/${tweetId}`);
  }

  createTweet(payload: CreateTweetPayload): Observable<{ tweet: Tweet }> {
    return this.api.post('/tweets', payload);
  }

  deleteTweet(tweetId: string): Observable<{ success: boolean }> {
    return this.api.delete(`/tweets/${tweetId}`);
  }

  likeTweet(tweetId: string): Observable<{ liked: boolean }> {
    return this.api.post(`/tweets/${tweetId}/like`, {});
  }

  unlikeTweet(tweetId: string): Observable<{ liked: boolean }> {
    return this.api.delete(`/tweets/${tweetId}/like`);
  }

  retweet(tweetId: string, payload: RetweetPayload): Observable<{ retweeted: boolean }> {
    return this.api.post(`/tweets/${tweetId}/retweet`, payload);
  }

  unretweet(tweetId: string): Observable<{ retweeted: boolean }> {
    return this.api.delete(`/tweets/${tweetId}/retweet`);
  }

  listComments(tweetId: string): Observable<PaginatedResponse<Comment>> {
    return this.api.get(`/tweets/${tweetId}/comments`);
  }

  createComment(tweetId: string, content: string): Observable<{ comment: Comment }> {
    return this.api.post(`/tweets/${tweetId}/comments`, { content });
  }

  deleteComment(commentId: string): Observable<{ success: boolean }> {
    return this.api.delete(`/tweets/comments/${commentId}`);
  }
}
