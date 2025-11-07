import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User, UserWithStats } from '../models/user';
import { PaginatedResponse } from '../models/pagination';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private readonly api: ApiService) {}

  getUser(userId: string): Observable<UserWithStats> {
    return this.api.get(`/users/${userId}`);
  }

  getFollowers(userId: string): Observable<PaginatedResponse<User>> {
    return this.api.get(`/users/${userId}/followers`);
  }

  getFollowing(userId: string): Observable<PaginatedResponse<User>> {
    return this.api.get(`/users/${userId}/following`);
  }

  follow(userId: string): Observable<{ following: boolean }> {
    return this.api.post(`/users/${userId}/follow`, {});
  }

  unfollow(userId: string): Observable<{ following: boolean }> {
    return this.api.delete(`/users/${userId}/follow`);
  }
}
