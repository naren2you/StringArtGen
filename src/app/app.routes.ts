import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent),
    title: 'StringArtGen - Home'
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent),
        title: 'Login - StringArtGen'
      },
      {
        path: 'register',
        loadComponent: () => import('./components/auth/register/register.component').then(m => m.RegisterComponent),
        title: 'Register - StringArtGen'
      }
    ]
  },
  {
    path: 'generate',
    loadComponent: () => import('./components/generate/generate.component').then(m => m.GenerateComponent),
    title: 'Generate String Art - StringArtGen'
  },
  {
    path: 'projects',
    children: [
      {
        path: '',
        loadComponent: () => import('./components/projects/projects-list/projects-list.component').then(m => m.ProjectsListComponent),
        title: 'My Projects - StringArtGen'
      },
      {
        path: ':id',
        loadComponent: () => import('./components/projects/project-detail/project-detail.component').then(m => m.ProjectDetailComponent),
        title: 'Project Details - StringArtGen'
      }
    ]
  },
  {
    path: 'gallery',
    loadComponent: () => import('./components/gallery/gallery.component').then(m => m.GalleryComponent),
    title: 'Public Gallery - StringArtGen'
  },
  {
    path: 'profile',
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent),
    title: 'Profile - StringArtGen'
  },
  {
    path: 'about',
    loadComponent: () => import('./components/about/about.component').then(m => m.AboutComponent),
    title: 'About - StringArtGen'
  },
  {
    path: '**',
    loadComponent: () => import('./components/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'Page Not Found - StringArtGen'
  }
];
