import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { getErrorMessage } from '../../utils/error-message';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth.page.html',
  styleUrl: './auth.page.scss',
})
export class AuthPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly mode = signal<'login' | 'register'>('login');
  readonly errorMessage = signal<string | null>(null);
  readonly loading = signal(false);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly registerForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(32)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(64)]],
    bio: [''],
  });

  readonly isLogin = computed(() => this.mode() === 'login');

  switchMode(next: 'login' | 'register'): void {
    if (this.loading()) {
      return;
    }
    this.errorMessage.set(null);
    this.mode.set(next);
  }

  async submit(): Promise<void> {
    if (this.loading()) {
      return;
    }
    this.errorMessage.set(null);

    try {
      this.loading.set(true);
      if (this.isLogin()) {
        if (this.loginForm.invalid) {
          this.loginForm.markAllAsTouched();
          this.loading.set(false);
          return;
        }
        await this.auth.login(this.loginForm.getRawValue());
      } else {
        if (this.registerForm.invalid) {
          this.registerForm.markAllAsTouched();
          this.loading.set(false);
          return;
        }
        await this.auth.register(this.registerForm.getRawValue());
      }
      await this.router.navigate(['/']);
    } catch (error) {
      this.errorMessage.set(getErrorMessage(error, 'Sikertelen bejelentkezés.'));
    } finally {
      this.loading.set(false);
    }
  }
}
