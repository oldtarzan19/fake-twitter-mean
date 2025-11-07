import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PaginatedResponse } from '../models/pagination';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  constructor(private readonly api: ApiService) {}

  listUsers(params: { skip?: number; limit?: number; search?: string } = {}): Observable<PaginatedResponse<User>> {
    const queryParams = new URLSearchParams();
    if (typeof params.skip === 'number') {
      queryParams.set('skip', String(params.skip));
    }
    if (typeof params.limit === 'number') {
      queryParams.set('limit', String(params.limit));
    }
    if (params.search) {
      queryParams.set('search', params.search);
    }

    const query = queryParams.toString();
    return this.api.get(`/admin/users${query ? `?${query}` : ''}`);
  }

  setSuspension(userId: string, isSuspended: boolean): Observable<{ user: User }> {
    return this.api.patch(`/admin/users/${userId}/suspension`, { isSuspended });
  }

  deleteUser(userId: string): Observable<{ success: boolean }> {
    return this.api.delete(`/admin/users/${userId}`);
  }
}
