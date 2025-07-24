import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="gallery-container">
      <h1>Public Gallery</h1>
      <p>Gallery component coming soon...</p>
    </div>
  `,
  styles: [`
    .gallery-container {
      text-align: center;
      padding: 2rem;
    }
  `]
})
export class GalleryComponent {} 