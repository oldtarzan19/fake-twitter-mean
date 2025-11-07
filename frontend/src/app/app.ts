import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly auth = inject(AuthService);

  readonly user = computed(() => this.auth.user());
  readonly isAdmin = computed(() => this.auth.isAdmin());

  async logout(): Promise<void> {
    await this.auth.logout();
  }
}
