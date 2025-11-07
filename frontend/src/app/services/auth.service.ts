import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { User } from '../models/user';

interface AuthResponse {
  user: User;
}

interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  bio?: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly userSignal = signal<User | null>(null);
  private readonly loadedSignal = signal(false);
  private loadPromise: Promise<void> | null = null;

  readonly user = computed(() => this.userSignal());
  readonly isAuthenticated = computed(() => this.userSignal() !== null);
  readonly isAdmin = computed(() => this.userSignal()?.role === 'admin');

  constructor(private readonly api: ApiService, private readonly router: Router) {}

  private async fetchCurrentUser(): Promise<void> {
    if (this.loadedSignal()) {
      return;
    }

    if (!this.loadPromise) {
      this.loadPromise = firstValueFrom(
        this.api.get<AuthResponse>('/auth/me').pipe(
          catchError((error) => {
            this.userSignal.set(null);
            return throwError(() => error);
          }),
        ),
      )
        .then((response) => {
          this.userSignal.set(response.user);
        })
        .catch(() => {
          this.userSignal.set(null);
        })
        .finally(() => {
          this.loadedSignal.set(true);
          this.loadPromise = null;
        });
    }

    await this.loadPromise;
  }

  async ensureAuthenticated(): Promise<User | null> {
    await this.fetchCurrentUser();
    return this.userSignal();
  }

  async login(payload: LoginPayload): Promise<User> {
    const response = await firstValueFrom(this.api.post<AuthResponse>('/auth/login', payload));
    this.userSignal.set(response.user);
    this.loadedSignal.set(true);
    return response.user;
  }

  async register(payload: RegisterPayload): Promise<User> {
    const response = await firstValueFrom(this.api.post<AuthResponse>('/auth/register', payload));
    this.userSignal.set(response.user);
    this.loadedSignal.set(true);
    return response.user;
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.api.post('/auth/logout', {}));
    this.userSignal.set(null);
    this.loadedSignal.set(true);
    await this.router.navigate(['/login']);
  }
}
