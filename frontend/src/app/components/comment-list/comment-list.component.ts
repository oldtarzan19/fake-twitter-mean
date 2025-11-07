import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Comment } from '../../models/tweet';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-comment-list',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './comment-list.component.html',
  styleUrl: './comment-list.component.scss',
})
export class CommentListComponent {
  @Input({ required: true }) comments: Comment[] = [];
  @Output() delete = new EventEmitter<string>();

  constructor(public readonly auth: AuthService) {}

  canDelete(comment: Comment): boolean {
    const user = this.auth.user();
    if (!user) {
      return false;
    }
    return user.role === 'admin' || user._id === comment.author._id;
  }
}
