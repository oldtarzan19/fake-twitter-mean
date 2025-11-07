import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Tweet } from '../../models/tweet';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-tweet-card',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './tweet-card.component.html',
  styleUrl: './tweet-card.component.scss',
})
export class TweetCardComponent {
  @Input({ required: true }) tweet!: Tweet;
  @Input() showActions = true;
  @Input() canDelete = false;

  @Output() like = new EventEmitter<string>();
  @Output() unlike = new EventEmitter<string>();
  @Output() retweet = new EventEmitter<string>();
  @Output() unretweet = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();

  constructor(public readonly auth: AuthService) {}

  onLikeClick(): void {
    if (!this.showActions) {
      return;
    }
    if (this.tweet.liked) {
      this.unlike.emit(this.tweet._id);
    } else {
      this.like.emit(this.tweet._id);
    }
  }

  onRetweetClick(): void {
    if (!this.showActions) {
      return;
    }
    if (this.tweet.retweeted) {
      this.unretweet.emit(this.tweet._id);
    } else {
      this.retweet.emit(this.tweet._id);
    }
  }

  onDeleteClick(): void {
    this.delete.emit(this.tweet._id);
  }
}
