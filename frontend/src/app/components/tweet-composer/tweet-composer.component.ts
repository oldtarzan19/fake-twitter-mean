import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tweet-composer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tweet-composer.component.html',
  styleUrl: './tweet-composer.component.scss',
})
export class TweetComposerComponent {
  @Output() create = new EventEmitter<string>();

  content = '';
  maxLength = 280;

  submit(): void {
    const trimmed = this.content.trim();
    if (!trimmed) {
      return;
    }
    this.create.emit(trimmed);
    this.content = '';
  }
}
