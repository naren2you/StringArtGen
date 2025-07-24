import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="profile-container">
      <h1>Profile</h1>
      <p>Profile component coming soon...</p>
    </div>
  `,
  styles: [`
    .profile-container {
      text-align: center;
      padding: 2rem;
    }
  `]
})
export class ProfileComponent {} 