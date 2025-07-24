import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  isLoggedIn = false;
  previewNails: Array<{x: number, y: number}> = [];
  previewStrings: Array<{from: {x: number, y: number}, length: number, angle: number}> = [];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.generatePreviewData();
  }

  private generatePreviewData(): void {
    // Generate nail positions in a circle
    const nailCount = 24;
    const centerX = 50;
    const centerY = 50;
    const radius = 35;

    for (let i = 0; i < nailCount; i++) {
      const angle = (2 * Math.PI * i) / nailCount;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      this.previewNails.push({ x, y });
    }

    // Generate some preview strings
    for (let i = 0; i < 12; i++) {
      const fromIndex = i;
      const toIndex = (i + 8) % nailCount;
      const from = this.previewNails[fromIndex];
      const to = this.previewNails[toIndex];
      
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;

      this.previewStrings.push({
        from: { x: from.x, y: from.y },
        length,
        angle
      });
    }
  }
} 