import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiService, ApiResponse } from './api.service';
import { 
  User, 
  UserRegistration, 
  UserLogin, 
  UserProfile, 
  PasswordChange,
  AuthResponse,
  UsernameCheck,
  EmailCheck 
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private apiService: ApiService) {}

  // User management
  private getStoredUser(): User | null {
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Convert date strings back to Date objects
        user.createdAt = new Date(user.createdAt);
        user.updatedAt = new Date(user.updatedAt);
        user.stats.lastActive = new Date(user.stats.lastActive);
        return user;
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('current_user');
        return null;
      }
    }
    return null;
  }

  private setStoredUser(user: User): void {
    localStorage.setItem('current_user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private removeStoredUser(): void {
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
  }

  public getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  public isLoggedIn(): boolean {
    return this.apiService.isAuthenticated() && !!this.getCurrentUser();
  }

  // Authentication methods
  public register(userData: UserRegistration): Observable<ApiResponse<{ user: User; token: string }>> {
    return this.apiService.postRequest<{ user: User; token: string }>('/auth/register', userData).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.apiService.setToken(response.data.token);
          this.setStoredUser(response.data.user);
        }
      }),
      catchError(error => {
        console.error('Registration error:', error);
        return throwError(() => error);
      })
    );
  }

  public login(credentials: UserLogin): Observable<ApiResponse<{ user: User; token: string }>> {
    return this.apiService.postRequest<{ user: User; token: string }>('/auth/login', credentials).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.apiService.setToken(response.data.token);
          this.setStoredUser(response.data.user);
        }
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  public logout(): Observable<ApiResponse> {
    return this.apiService.postRequest<ApiResponse>('/auth/logout', {}).pipe(
      tap(() => {
        this.apiService.clearToken();
        this.removeStoredUser();
      }),
      catchError(error => {
        // Even if logout fails, clear local data
        this.apiService.clearToken();
        this.removeStoredUser();
        console.error('Logout error:', error);
        return throwError(() => error);
      })
    );
  }

  public getProfile(): Observable<ApiResponse<{ user: User }>> {
    return this.apiService.getRequest<{ user: User }>('/auth/profile').pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setStoredUser(response.data.user);
        }
      }),
      catchError(error => {
        console.error('Get profile error:', error);
        return throwError(() => error);
      })
    );
  }

  public updateProfile(profileData: UserProfile): Observable<ApiResponse<{ user: User }>> {
    return this.apiService.putRequest<{ user: User }>('/auth/profile', profileData).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setStoredUser(response.data.user);
        }
      }),
      catchError(error => {
        console.error('Update profile error:', error);
        return throwError(() => error);
      })
    );
  }

  public changePassword(passwordData: PasswordChange): Observable<ApiResponse> {
    return this.apiService.postRequest<ApiResponse>('/auth/change-password', passwordData).pipe(
      catchError(error => {
        console.error('Change password error:', error);
        return throwError(() => error);
      })
    );
  }

  // Validation methods
  public checkUsername(username: string): Observable<ApiResponse<UsernameCheck>> {
    return this.apiService.getRequest<UsernameCheck>(`/auth/check-username/${username}`).pipe(
      catchError(error => {
        console.error('Username check error:', error);
        return throwError(() => error);
      })
    );
  }

  public checkEmail(email: string): Observable<ApiResponse<EmailCheck>> {
    return this.apiService.getRequest<EmailCheck>(`/auth/check-email/${email}`).pipe(
      catchError(error => {
        console.error('Email check error:', error);
        return throwError(() => error);
      })
    );
  }

  // Auto-login on app start
  public autoLogin(): Observable<boolean> {
    if (!this.isLoggedIn()) {
      return new Observable(observer => {
        observer.next(false);
        observer.complete();
      });
    }

    return new Observable(observer => {
      this.getProfile().subscribe({
        next: (response) => {
          if (response.success) {
            observer.next(true);
          } else {
            this.apiService.clearToken();
            this.removeStoredUser();
            observer.next(false);
          }
          observer.complete();
        },
        error: (error) => {
          console.error('Auto-login error:', error);
          this.apiService.clearToken();
          this.removeStoredUser();
          observer.next(false);
          observer.complete();
        }
      });
    });
  }

  // Utility methods
  public getUserFullName(): string {
    const user = this.getCurrentUser();
    if (!user) return '';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.lastName) {
      return user.lastName;
    } else {
      return user.username;
    }
  }

  public getUserAvatar(): string | null {
    const user = this.getCurrentUser();
    return user?.avatar || null;
  }

  public getUserRole(): string {
    const user = this.getCurrentUser();
    return user?.role || 'user';
  }

  public isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  public isModerator(): boolean {
    const role = this.getUserRole();
    return role === 'admin' || role === 'moderator';
  }

  // Clear all auth data (for testing or manual logout)
  public clearAuthData(): void {
    this.apiService.clearToken();
    this.removeStoredUser();
  }
} 