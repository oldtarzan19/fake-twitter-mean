import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { TweetCardComponent } from '../../components/tweet-card/tweet-card.component';
import { CommentListComponent } from '../../components/comment-list/comment-list.component';
import { TweetService } from '../../services/tweet.service';
import { Tweet, Comment } from '../../models/tweet';
import { getErrorMessage } from '../../utils/error-message';

@Component({
  selector: 'app-tweet-detail-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TweetCardComponent, CommentListComponent],
  templateUrl: './tweet-detail.page.html',
  styleUrl: './tweet-detail.page.scss',
})
export class TweetDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tweetService = inject(TweetService);

  readonly tweet = signal<Tweet | null>(null);
  readonly comments = signal<Comment[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly commentContent = signal('');

  readonly hasTweet = computed(() => this.tweet() !== null);

  get commentText(): string {
    return this.commentContent();
  }

  set commentText(value: string) {
    this.commentContent.set(value);
  }

  async ngOnInit(): Promise<void> {
    const tweetId = this.route.snapshot.paramMap.get('id');
    if (!tweetId) {
      await this.router.navigate(['/']);
      return;
    }

    await this.loadTweet(tweetId);
  }

  private async loadTweet(tweetId: string): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const [tweetResponse, commentsResponse] = await Promise.all([
        firstValueFrom(this.tweetService.getTweet(tweetId)),
        firstValueFrom(this.tweetService.listComments(tweetId)),
      ]);
      this.tweet.set(tweetResponse.tweet);
      this.comments.set(commentsResponse.items ?? []);
    } catch (error) {
      this.errorMessage.set(getErrorMessage(error, 'Nem sikerült betölteni a tweetet.'));
    } finally {
      this.loading.set(false);
    }
  }

  async likeTweet(tweetId: string, like: boolean): Promise<void> {
    try {
      if (like) {
        await firstValueFrom(this.tweetService.likeTweet(tweetId));
        this.tweet.update((current) =>
          current
            ? { ...current, liked: true, likesCount: current.likesCount + 1 }
            : current,
        );
      } else {
        await firstValueFrom(this.tweetService.unlikeTweet(tweetId));
        this.tweet.update((current) =>
          current
            ? {
                ...current,
                liked: false,
                likesCount: Math.max(0, current.likesCount - 1),
              }
            : current,
        );
      }
    } catch (error) {
      this.errorMessage.set(getErrorMessage(error, 'Nem sikerült frissíteni a like-ot.'));
    }
  }

  async retweet(tweetId: string, add: boolean): Promise<void> {
    try {
      if (add) {
        await firstValueFrom(this.tweetService.retweet(tweetId, {}));
        this.tweet.update((current) =>
          current
            ? { ...current, retweeted: true, retweetsCount: current.retweetsCount + 1 }
            : current,
        );
      } else {
        await firstValueFrom(this.tweetService.unretweet(tweetId));
        this.tweet.update((current) =>
          current
            ? {
                ...current,
                retweeted: false,
                retweetsCount: Math.max(0, current.retweetsCount - 1),
              }
            : current,
        );
      }
    } catch (error) {
      this.errorMessage.set(getErrorMessage(error, 'Nem sikerült retweetelni.'));
    }
  }

  async deleteTweet(tweetId: string): Promise<void> {
    try {
      await firstValueFrom(this.tweetService.deleteTweet(tweetId));
      await this.router.navigate(['/']);
    } catch (error) {
      this.errorMessage.set(getErrorMessage(error, 'Nem sikerült törölni a tweetet.'));
    }
  }

  async submitComment(): Promise<void> {
    const tweet = this.tweet();
    const content = this.commentText.trim();
    if (!tweet || !content) {
      return;
    }

    try {
      const response = await firstValueFrom(this.tweetService.createComment(tweet._id, content));
      this.comments.update((prev) => [...prev, response.comment]);
      this.tweet.update((current) =>
        current
          ? { ...current, commentsCount: current.commentsCount + 1 }
          : current,
      );
      this.commentContent.set('');
    } catch (error) {
      this.errorMessage.set(getErrorMessage(error, 'Nem sikerült elmenteni a kommentet.'));
    }
  }

  async deleteComment(commentId: string): Promise<void> {
    try {
      await firstValueFrom(this.tweetService.deleteComment(commentId));
      this.comments.update((prev) => prev.filter((comment) => comment._id !== commentId));
      this.tweet.update((current) =>
        current
          ? { ...current, commentsCount: Math.max(0, current.commentsCount - 1) }
          : current,
      );
    } catch (error) {
      this.errorMessage.set(getErrorMessage(error, 'Nem sikerült törölni a kommentet.'));
    }
  }

  onLike(tweetId: string): void {
    void this.likeTweet(tweetId, true);
  }

  onUnlike(tweetId: string): void {
    void this.likeTweet(tweetId, false);
  }

  onRetweet(tweetId: string): void {
    void this.retweet(tweetId, true);
  }

  onUnretweet(tweetId: string): void {
    void this.retweet(tweetId, false);
  }
}
