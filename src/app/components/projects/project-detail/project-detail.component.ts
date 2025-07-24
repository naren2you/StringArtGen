import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="project-detail-container">
      <h1>Project Details</h1>
      <p>Project detail component coming soon...</p>
    </div>
  `,
  styles: [`
    .project-detail-container {
      text-align: center;
      padding: 2rem;
    }
  `]
})
export class ProjectDetailComponent {} 