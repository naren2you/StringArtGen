import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="about-container">
      <h1>About StringArtGen</h1>
      <p>About component coming soon...</p>
    </div>
  `,
  styles: [`
    .about-container {
      text-align: center;
      padding: 2rem;
    }
  `]
})
export class AboutComponent {} 