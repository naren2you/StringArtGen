import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';
  private tokenSubject = new BehaviorSubject<string | null>(this.getStoredToken());
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Token management
  private getStoredToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private setStoredToken(token: string): void {
    localStorage.setItem('auth_token', token);
    this.tokenSubject.next(token);
  }

  private removeStoredToken(): void {
    localStorage.removeItem('auth_token');
    this.tokenSubject.next(null);
  }

  public getToken(): string | null {
    return this.tokenSubject.value;
  }

  public setToken(token: string): void {
    this.setStoredToken(token);
  }

  public clearToken(): void {
    this.removeStoredToken();
  }

  public isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // HTTP headers
  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private getMultipartHeaders(): HttpHeaders {
    const token = this.getToken();
    let headers = new HttpHeaders();

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  // Generic HTTP methods
  private get<T>(url: string): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.apiUrl}${url}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  private post<T>(url: string, data: any): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.apiUrl}${url}`, data, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  private put<T>(url: string, data: any): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.apiUrl}${url}`, data, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  private delete<T>(url: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.apiUrl}${url}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  private postMultipart<T>(url: string, formData: FormData): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.apiUrl}${url}`, formData, {
      headers: this.getMultipartHeaders()
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // Error handling
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    let errorCode = 'UNKNOWN_ERROR';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
      errorCode = 'CLIENT_ERROR';
    } else {
      // Server-side error
      if (error.status === 401) {
        errorCode = 'UNAUTHORIZED';
        errorMessage = 'Authentication required. Please log in.';
        this.clearToken();
      } else if (error.status === 403) {
        errorCode = 'FORBIDDEN';
        errorMessage = 'Access denied. You don\'t have permission to perform this action.';
      } else if (error.status === 404) {
        errorCode = 'NOT_FOUND';
        errorMessage = 'The requested resource was not found.';
      } else if (error.status === 422) {
        errorCode = 'VALIDATION_ERROR';
        errorMessage = 'Validation failed. Please check your input.';
      } else if (error.status >= 500) {
        errorCode = 'SERVER_ERROR';
        errorMessage = 'Server error. Please try again later.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
        errorCode = error.error.code || 'API_ERROR';
      }
    }

    console.error('API Error:', {
      status: error.status,
      message: errorMessage,
      code: errorCode,
      url: error.url,
      error: error.error
    });

    return throwError(() => ({
      message: errorMessage,
      code: errorCode,
      status: error.status,
      details: error.error
    }));
  }

  // Health check
  public healthCheck(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl.replace('/api', '')}/health`).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // Generic response wrapper
  public wrapResponse<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      throw new Error(response.message || 'API request failed');
    }
    return response.data as T;
  }

  // Export methods for use in other services
  public getRequest<T>(url: string): Observable<ApiResponse<T>> {
    return this.get<T>(url);
  }

  public postRequest<T>(url: string, data: any): Observable<ApiResponse<T>> {
    return this.post<T>(url, data);
  }

  public putRequest<T>(url: string, data: any): Observable<ApiResponse<T>> {
    return this.put<T>(url, data);
  }

  public deleteRequest<T>(url: string): Observable<ApiResponse<T>> {
    return this.delete<T>(url);
  }

  public postMultipartRequest<T>(url: string, formData: FormData): Observable<ApiResponse<T>> {
    return this.postMultipart<T>(url, formData);
  }
} 