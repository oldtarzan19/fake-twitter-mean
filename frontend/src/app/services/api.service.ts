import { Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const DEFAULT_API_BASE = 'http://localhost:3000/api';

const resolveApiBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    return DEFAULT_API_BASE;
  }

  const origin = window.location.origin;
  if (origin.includes('localhost:4200')) {
    return DEFAULT_API_BASE;
  }

  return '/api';
};

const API_BASE_URL = resolveApiBaseUrl();

export interface RequestOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> };
  context?: HttpContext;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private readonly http: HttpClient) {}

  get<T>(path: string, options?: RequestOptions): Observable<T> {
    return this.http.get<T>(`${API_BASE_URL}${path}`, {
      withCredentials: true,
      ...options,
    });
  }

  post<T>(path: string, body: unknown, options?: RequestOptions): Observable<T> {
    return this.http.post<T>(`${API_BASE_URL}${path}`, body, {
      withCredentials: true,
      ...options,
    });
  }

  patch<T>(path: string, body: unknown, options?: RequestOptions): Observable<T> {
    return this.http.patch<T>(`${API_BASE_URL}${path}`, body, {
      withCredentials: true,
      ...options,
    });
  }

  delete<T>(path: string, options?: RequestOptions): Observable<T> {
    return this.http.delete<T>(`${API_BASE_URL}${path}`, {
      withCredentials: true,
      ...options,
    });
  }
}
