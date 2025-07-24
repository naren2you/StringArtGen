export interface StringArt {
  _id: string;
  user: string | User;
  title: string;
  description?: string;
  originalImage: {
    filename: string;
    path: string;
    size: number;
    mimetype: string;
    dimensions: {
      width: number;
      height: number;
    };
  };
  settings: {
    nails: number;
    strings: number;
    algorithm: 'greedy' | 'genetic' | 'hybrid';
    color: 'black' | 'white' | 'custom';
    customColor?: string;
    blurRadius: number;
    contrast: number;
  };
  coordinates: StringCoordinate[];
  preview: {
    data: string; // Base64 encoded image
    format: 'png' | 'jpeg' | 'webp';
  };
  stats: {
    generationTime: number;
    quality: number;
    stringEfficiency: number;
  };
  tags: string[];
  isPublic: boolean;
  isFavorite: boolean;
  downloads: number;
  views: number;
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  error?: {
    message: string;
    code: string;
    timestamp: Date;
  };
  totalCoordinates?: number;
  completionPercentage?: number;
  estimatedTimeRemaining?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StringCoordinate {
  from: number;
  to: number;
  order: number;
}

export interface StringArtSettings {
  nails: number;
  strings: number;
  algorithm: 'greedy' | 'genetic' | 'hybrid';
  color: 'black' | 'white' | 'custom';
  customColor?: string;
  blurRadius: number;
  contrast: number;
}

export interface StringArtGeneration {
  title: string;
  description?: string;
  settings: StringArtSettings;
  tags?: string[];
  isPublic?: boolean;
}

export interface StringArtStatus {
  id: string;
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  estimatedTimeRemaining: number;
  coordinates: number;
  totalStrings: number;
  error?: {
    message: string;
    code: string;
  };
}

export interface StringArtExport {
  metadata: {
    title: string;
    description?: string;
    created: Date;
    nails: number;
    strings: number;
    algorithm: string;
    quality: number;
  };
  coordinates: StringCoordinate[];
  settings: StringArtSettings;
}

export interface ProjectStats {
  overview: {
    totalProjects: number;
    completedProjects: number;
    processingProjects: number;
    failedProjects: number;
    completionRate: number;
  };
  metrics: {
    totalStrings: number;
    averageQuality: number;
    totalViews: number;
    totalDownloads: number;
  };
  preferences: {
    favoriteProjects: number;
    publicProjects: number;
  };
  recentActivity: Array<{
    _id: string;
    title: string;
    status: string;
    updatedAt: Date;
  }>;
  qualityDistribution: Array<{
    _id: string;
    count: number;
  }>;
}

export interface ProjectFilters {
  page?: number;
  limit?: number;
  status?: 'processing' | 'completed' | 'failed' | 'cancelled';
  isPublic?: boolean;
  isFavorite?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'status' | 'quality';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ProjectsResponse {
  projects: StringArt[];
  pagination: PaginationInfo;
}

export interface TagInfo {
  _id: string;
  count: number;
}

// Import User interface to avoid circular dependency
interface User {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
} 