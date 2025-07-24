import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="projects-list-container">
      <h1>My Projects</h1>
      <p>Projects list component coming soon...</p>
    </div>
  `,
  styles: [`
    .projects-list-container {
      text-align: center;
      padding: 2rem;
    }
  `]
})
export class ProjectsListComponent {} 