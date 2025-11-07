import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TweetCardComponent } from '../../components/tweet-card/tweet-card.component';
import { TweetComposerComponent } from '../../components/tweet-composer/tweet-composer.component';
import { Tweet } from '../../models/tweet';
import { User } from '../../models/user';
import { TweetService } from '../../services/tweet.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { getErrorMessage } from '../../utils/error-message';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TweetCardComponent, TweetComposerComponent],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
})
export class ProfilePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tweetService = inject(TweetService);
  private readonly userService = inject(UserService);
  private readonly auth = inject(AuthService);

  readonly profileUser = signal<User | null>(null);
  readonly stats = signal({ followersCount: 0, followingCount: 0, tweetsCount: 0 });
  readonly tweets = signal<Tweet[]>([]);
  readonly followers = signal<User[]>([]);
  readonly following = signal<User[]>([]);

  readonly activeTab = signal<'tweets' | 'followers' | 'following'>('tweets');
  readonly loading = signal(false);
  readonly loadingMoreTweets = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly hasMoreTweets = signal(false);
  readonly isFollowing = signal(false);

  readonly currentUser = computed(() => this.auth.user());
  readonly isOwnProfile = computed(() => this.currentUser()?._id === this.profileUser()?._id);

  private userId: string | null = null;

  async ngOnInit(): Promise<void> {
    this.userId = this.route.snapshot.paramMap.get('id');
    if (!this.userId) {
      this.errorMessage.set('Ismeretlen felhasználó.');
      return;
    }

    await this.loadProfile();
  }

  private async loadProfile(): Promise<void> {
    if (!this.userId) return;
    this.loading.set(true);
    this.errorMessage.set(null);

  try {
      const response = await firstValueFrom(this.userService.getUser(this.userId));
      this.profileUser.set(response.user);
      this.stats.set(response.stats);
      this.isFollowing.set(Boolean(response.relationship?.isFollowing));
      if (response.relationship?.isSelf) {
        this.activeTab.set('tweets');
      }
      await this.loadTweets(true);
      await Promise.all([this.loadFollowers(), this.loadFollowing()]);
    } catch (error) {
      this.errorMessage.set(getErrorMessage(error, 'Nem sikerült betölteni a profilt.'));
    } finally {
      this.loading.set(false);
    }
  }

  async loadTweets(reset = false): Promise<void> {
    if (!this.userId) return;
    if (reset) {
      this.loadingMoreTweets.set(false);
    }
    const skip = reset ? 0 : this.tweets().length;
    if (!reset && this.loadingMoreTweets()) {
      return;
    }

    if (!reset) {
      this.loadingMoreTweets.set(true);
    }

    try {
      const response = await firstValueFrom(
        this.tweetService.listTweets({ scope: 'user', userId: this.userId, limit: PAGE_SIZE, skip }),
      );
      const items = response.items ?? [];
      this.hasMoreTweets.set(items.length === PAGE_SIZE);
      if (reset) {
        this.tweets.set(items);
      } else {
        this.tweets.update((prev) => [...prev, ...items]);
      }
    } catch (error) {
      this.errorMessage.set(getErrorMessage(error, 'Nem sikerült betölteni a tweeteket.'));
    } finally {
      this.loadingMoreTweets.set(false);
    }
  }

  async createTweet(content: string): Promise<void> {
    try {
      const response = await firstValueFrom(this.tweetService.createTweet({ content }));
      if (response.tweet.author._id === this.profileUser()?._id) {
        this.tweets.update((prev) => [response.tweet, ...prev]);
        this.stats.update((prev) => ({ ...prev, tweetsCount: prev.tweetsCount + 1 }));
      }
    } catch (error) {
      this.errorMessage.set(getErrorMessage(error, 'Nem sikerült létrehozni a tweetet.'));
    }
  }

  async follow(): Promise<void> {
    if (!this.userId) return;
    try {
      await firstValueFrom(this.userService.follow(this.userId));
      this.isFollowing.set(true);
      this.stats.update((prev) => ({ ...prev, followersCount: prev.followersCount + 1 }));
      await this.loadFollowers();
    } catch (error) {
      this.errorMessage.set(getErrorMessage(error, 'Nem sikerült követni a felhasználót.'));
    }
  }

  async unfollow(): Promise<void> {
    if (!this.userId) return;
    try {
      await firstValueFrom(this.userService.unfollow(this.userId));
      this.isFollowing.set(false);
      this.stats.update((prev) => ({ ...prev, followersCount: Math.max(0, prev.followersCount - 1) }));
      await this.loadFollowers();
    } catch (error) {
      this.errorMessage.set(getErrorMessage(error, 'Nem sikerült leállítani a követést.'));
    }
  }

  async loadFollowers(): Promise<void> {
    if (!this.userId) return;
    try {
      const response = await firstValueFrom(this.userService.getFollowers(this.userId));
      this.followers.set(response.items ?? []);
      const currentId = this.currentUser()?._id;
      if (currentId && !this.isOwnProfile()) {
        this.isFollowing.set(response.items?.some((user) => user._id === currentId) ?? false);
      }
    } catch (error) {
      this.errorMessage.set(getErrorMessage(error, 'Nem sikerült betölteni a követőket.'));
    }
  }

  async loadFollowing(): Promise<void> {
    if (!this.userId) return;
    try {
      const response = await firstValueFrom(this.userService.getFollowing(this.userId));
      this.following.set(response.items ?? []);
    } catch (error) {
      this.errorMessage.set(getErrorMessage(error, 'Nem sikerült betölteni a követetteket.'));
    }
  }

  onLike(tweetId: string): void {
    void this.toggleLike(tweetId, true);
  }

  onUnlike(tweetId: string): void {
    void this.toggleLike(tweetId, false);
  }

  async toggleLike(tweetId: string, like: boolean): Promise<void> {
    try {
      if (like) {
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
              ? { ...tweet, liked: false, likesCount: Math.max(0, tweet.likesCount - 1) }
              : tweet,
          ),
        );
      }
    } catch (error) {
      this.errorMessage.set(getErrorMessage(error, 'Nem sikerült frissíteni a like-ot.'));
    }
  }

  onRetweet(tweetId: string): void {
    void this.toggleRetweet(tweetId, true);
  }

  onUnretweet(tweetId: string): void {
    void this.toggleRetweet(tweetId, false);
  }

  async toggleRetweet(tweetId: string, retweet: boolean): Promise<void> {
    try {
      if (retweet) {
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
      this.stats.update((prev) => ({ ...prev, tweetsCount: Math.max(0, prev.tweetsCount - 1) }));
    } catch (error) {
      this.errorMessage.set(getErrorMessage(error, 'Nem sikerült törölni a tweetet.'));
    }
  }
}
