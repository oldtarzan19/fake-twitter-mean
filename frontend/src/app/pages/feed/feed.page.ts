import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { TweetComposerComponent } from '../../components/tweet-composer/tweet-composer.component';
import { TweetCardComponent } from '../../components/tweet-card/tweet-card.component';
import { Tweet } from '../../models/tweet';
import { TweetService } from '../../services/tweet.service';
import { AuthService } from '../../services/auth.service';
import { getErrorMessage } from '../../utils/error-message';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-feed-page',
  standalone: true,
  imports: [CommonModule, TweetComposerComponent, TweetCardComponent],
  templateUrl: './feed.page.html',
  styleUrl: './feed.page.scss',
})
export class FeedPage implements OnInit {
  private readonly tweetService = inject(TweetService);
  private readonly auth = inject(AuthService);

  readonly scope = signal<'global' | 'following'>('global');
  readonly tweets = signal<Tweet[]>([]);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly hasMore = signal(false);

  readonly user = computed(() => this.auth.user());

  async ngOnInit(): Promise<void> {
    await this.loadTweets(true);
  }

  async switchScope(next: 'global' | 'following'): Promise<void> {
    if (this.scope() === next) {
      return;
    }
    this.scope.set(next);
    await this.loadTweets(true);
  }

  async loadTweets(reset = false): Promise<void> {
    if (this.loading() || this.loadingMore()) {
      return;
    }

    this.errorMessage.set(null);
    if (reset) {
      this.loading.set(true);
    } else {
      this.loadingMore.set(true);
    }

    const skip = reset ? 0 : this.tweets().length;

    try {
      const response = await firstValueFrom(
        this.tweetService.listTweets({ scope: this.scope(), limit: PAGE_SIZE, skip }),
      );
      const items = response.items ?? [];
      this.hasMore.set(items.length === PAGE_SIZE);
      if (reset) {
        this.tweets.set(items);
      } else {
        this.tweets.update((prev) => [...prev, ...items]);
      }
    } catch (error) {
      this.errorMessage.set(getErrorMessage(error, 'Nem sikerült betölteni a feedet.'));
      if (reset) {
        this.tweets.set([]);
      }
    } finally {
      this.loading.set(false);
      this.loadingMore.set(false);
    }
  }

  async createTweet(content: string): Promise<void> {
    try {
      const response = await firstValueFrom(this.tweetService.createTweet({ content }));
      this.tweets.update((prev) => [response.tweet, ...prev]);
    } catch (error) {
      this.errorMessage.set(getErrorMessage(error, 'Nem sikerült elküldeni a tweetet.'));
    }
  }

  async toggleLike(tweetId: string, liked: boolean): Promise<void> {
    try {
      if (liked) {
        await firstValueFrom(this.tweetService.likeTweet(tweetId));
        this.tweets.update((prev) =>
          prev.map((tweet) =>
            tweet._id === tweetId
              ? { ...tweet, liked: true, likesCount: tweet.likesCount + 1 }
              : tweet,
          ),
        );
      } else {
        await firstValueFrom(this.tweetService.unlikeTweet(tweetId));
        this.tweets.update((prev) =>
          prev.map((tweet) =>
            tweet._id === tweetId
              ? {
                  ...tweet,
                  liked: false,
                  likesCount: Math.max(0, tweet.likesCount - 1),
                }
              : tweet,
          ),
        );
      }
    } catch (error) {
      this.errorMessage.set(getErrorMessage(error, 'Nem sikerült frissíteni a like-ot.'));
    }
  }

  async toggleRetweet(tweetId: string, retweeted: boolean): Promise<void> {
    try {
      if (retweeted) {
        await firstValueFrom(this.tweetService.retweet(tweetId, {}));
        this.tweets.update((prev) =>
          prev.map((tweet) =>
            tweet._id === tweetId
              ? { ...tweet, retweeted: true, retweetsCount: tweet.retweetsCount + 1 }
              : tweet,
          ),
        );
      } else {
        await firstValueFrom(this.tweetService.unretweet(tweetId));
        this.tweets.update((prev) =>
          prev.map((tweet) =>
            tweet._id === tweetId
              ? {
                  ...tweet,
                  retweeted: false,
                  retweetsCount: Math.max(0, tweet.retweetsCount - 1),
                }
              : tweet,
          ),
        );
      }
    } catch (error) {
      this.errorMessage.set(getErrorMessage(error, 'Nem sikerült retweetelni.'));
    }
  }

  async deleteTweet(tweetId: string): Promise<void> {
    try {
      await firstValueFrom(this.tweetService.deleteTweet(tweetId));
      this.tweets.update((prev) => prev.filter((tweet) => tweet._id !== tweetId));
    } catch (error) {
      this.errorMessage.set(getErrorMessage(error, 'Nem sikerült törölni a tweetet.'));
    }
  }

  onLike(tweetId: string): void {
    void this.toggleLike(tweetId, true);
  }

  onUnlike(tweetId: string): void {
    void this.toggleLike(tweetId, false);
  }

  onRetweet(tweetId: string): void {
    void this.toggleRetweet(tweetId, true);
  }

  onUnretweet(tweetId: string): void {
    void this.toggleRetweet(tweetId, false);
  }
}
