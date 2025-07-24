import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StringArtProject {
  _id?: string;
  userId?: string;
  title: string;
  description?: string;
  originalImage: string;
  settings: {
    nailCount: number;
    stringCount: number;
    algorithm: string;
    stringColor: string;
    backgroundColor: string;
    stringThickness: number;
    opacity: number;
    contrast: number;
    brightness: number;
    noiseReduction: number;
    showNails: boolean;
    autoOptimize: boolean;
  };
  result: {
    nailCount: number;
    stringCount: number;
    generationTime: number;
    fileSize: string;
    nailPositions: Array<{x: number, y: number, index: number}>;
    stringPaths: Array<{from: number, to: number, order: number}>;
    canvasWidth: number;
    canvasHeight: number;
    centerX: number;
    centerY: number;
    radius: number;
  };
  generatedImage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SaveProjectResponse {
  success: boolean;
  message: string;
  project?: StringArtProject;
  error?: string;
}

export interface GetProjectsResponse {
  success: boolean;
  projects: StringArtProject[];
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StringArtService {
  private apiUrl = 'http://localhost:3000/api'; // Backend API URL

  constructor(private http: HttpClient) {}

  // Save a new string art project
  saveProject(project: StringArtProject): Observable<SaveProjectResponse> {
    return this.http.post<SaveProjectResponse>(`${this.apiUrl}/projects`, project);
  }

  // Get all projects for the current user
  getProjects(): Observable<GetProjectsResponse> {
    return this.http.get<GetProjectsResponse>(`${this.apiUrl}/projects`);
  }

  // Get a specific project by ID
  getProject(projectId: string): Observable<{success: boolean, project?: StringArtProject, error?: string}> {
    return this.http.get<{success: boolean, project?: StringArtProject, error?: string}>(`${this.apiUrl}/projects/${projectId}`);
  }

  // Update an existing project
  updateProject(projectId: string, project: Partial<StringArtProject>): Observable<SaveProjectResponse> {
    return this.http.put<SaveProjectResponse>(`${this.apiUrl}/projects/${projectId}`, project);
  }

  // Delete a project
  deleteProject(projectId: string): Observable<{success: boolean, message: string, error?: string}> {
    return this.http.delete<{success: boolean, message: string, error?: string}>(`${this.apiUrl}/projects/${projectId}`);
  }

  // Generate string art from image (backend processing)
  generateStringArt(imageData: string, settings: any): Observable<{success: boolean, result?: any, error?: string}> {
    return this.http.post<{success: boolean, result?: any, error?: string}>(`${this.apiUrl}/generate`, {
      image: imageData,
      settings: settings
    });
  }

  // Share a project
  shareProject(projectId: string): Observable<{success: boolean, shareUrl?: string, error?: string}> {
    return this.http.post<{success: boolean, shareUrl?: string, error?: string}>(`${this.apiUrl}/projects/${projectId}/share`, {});
  }

  // Get project statistics
  getProjectStats(): Observable<{success: boolean, stats?: any, error?: string}> {
    return this.http.get<{success: boolean, stats?: any, error?: string}>(`${this.apiUrl}/projects/stats`);
  }
} 