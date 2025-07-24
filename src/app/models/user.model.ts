export interface User {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isActive: boolean;
  isVerified: boolean;
  role: 'user' | 'admin' | 'moderator';
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
  stats: {
    projectsCreated: number;
    totalStrings: number;
    lastActive: Date;
  };
  fullName?: string;
  projectsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRegistration {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface UserLogin {
  identifier: string; // email or username
  password: string;
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'auto';
    language?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
    };
  };
}

export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface UsernameCheck {
  available: boolean;
  username: string;
}

export interface EmailCheck {
  available: boolean;
  email: string;
} 