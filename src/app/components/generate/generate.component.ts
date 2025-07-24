import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StringArtService, StringArtProject } from '../../services/string-art.service';

interface StringArtSettings {
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
}

interface StringArtResult {
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
}

interface ImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

@Component({
  selector: 'app-generate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './generate.component.html',
  styleUrls: ['./generate.component.scss']
})
export class GenerateComponent implements OnInit, AfterViewInit {
  @ViewChild('previewCanvas') previewCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('resultCanvas') resultCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('finalResultCanvas') finalResultCanvas!: ElementRef<HTMLCanvasElement>;

  currentStep = 1;
  selectedImage: string | null = null;
  imageSource: 'upload' | 'url' = 'upload';
  imageUrl = '';
  isDragOver = false;
  
  // Project details
  projectTitle = '';
  projectDescription = '';
  isSaving = false;
  saveSuccess = false;
  saveError = '';
  
  settings: StringArtSettings = {
    nailCount: 60,
    stringCount: 500,
    algorithm: 'optimized',
    stringColor: '#000000',
    backgroundColor: '#ffffff',
    stringThickness: 2,
    opacity: 0.8,
    contrast: 1.0,
    brightness: 1.0,
    noiseReduction: 0.2,
    showNails: true,
    autoOptimize: true
  };

  generationComplete = false;
  generationProgress = 0;
  generationStatus = 'Initializing...';
  resultData: StringArtResult = {
    nailCount: 0,
    stringCount: 0,
    generationTime: 0,
    fileSize: '0 KB',
    nailPositions: [],
    stringPaths: [],
    canvasWidth: 0,
    canvasHeight: 0,
    centerX: 0,
    centerY: 0,
    radius: 0
  };

  private previewContext!: CanvasRenderingContext2D;
  private resultContext!: CanvasRenderingContext2D;
  private originalImage: HTMLImageElement | null = null;
  private processedImageData: ImageData | null = null;
  private zoomLevel = 1;

  constructor(
    private router: Router,
    private stringArtService: StringArtService
  ) {}

  ngOnInit(): void {
    // Initialize with default settings
  }

  ngAfterViewInit(): void {
    this.initializeCanvases();
  }

  private initializeCanvases(): void {
    if (this.previewCanvas) {
      this.previewContext = this.previewCanvas.nativeElement.getContext('2d')!;
      this.previewCanvas.nativeElement.width = 400;
      this.previewCanvas.nativeElement.height = 400;
    }
  }

  private initializeResultCanvas(): void {
    if (this.resultCanvas && !this.resultContext) {
      console.log('🎨 Initializing result canvas...');
      this.resultContext = this.resultCanvas.nativeElement.getContext('2d')!;
      this.resultCanvas.nativeElement.width = 600;
      this.resultCanvas.nativeElement.height = 600;
      console.log('✅ Result canvas initialized');
    }
  }

  // File Upload Methods
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  private processFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.selectedImage = e.target?.result as string;
      this.loadImageForProcessing();
    };
    reader.readAsDataURL(file);
  }

  loadImageFromUrl(): void {
    if (!this.imageUrl.trim()) {
      alert('Please enter a valid image URL.');
      return;
    }

    this.selectedImage = this.imageUrl;
    this.loadImageForProcessing();
  }

  private loadImageForProcessing(): void {
    if (!this.selectedImage) return;

    this.originalImage = new Image();
    this.originalImage.crossOrigin = 'anonymous';
    this.originalImage.onload = () => {
      this.processImageData();
      this.updatePreview();
    };
    this.originalImage.src = this.selectedImage;
  }

  private processImageData(): void {
    if (!this.originalImage) return;

    // Create a temporary canvas to process the image
    const tempCanvas = document.createElement('canvas');
    const tempContext = tempCanvas.getContext('2d')!;
    
    // Set canvas size to match image
    tempCanvas.width = this.originalImage.width;
    tempCanvas.height = this.originalImage.height;
    
    // Draw image to canvas
    tempContext.drawImage(this.originalImage, 0, 0);
    
    // Get image data for processing
    const imageData = tempContext.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Apply image processing
    this.processedImageData = this.applyImageProcessing(imageData);
  }

  private applyImageProcessing(imageData: ImageData): ImageData {
    const { data, width, height } = imageData;
    const processedData = new Uint8ClampedArray(data.length);
    
    // Apply brightness, contrast, and noise reduction
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      let a = data[i + 3];
      
      // Convert to grayscale
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // Apply brightness
      let adjusted = gray * this.settings.brightness;
      
      // Apply contrast
      adjusted = (adjusted - 128) * this.settings.contrast + 128;
      
      // Apply noise reduction (simple blur)
      if (this.settings.noiseReduction > 0) {
        // Simple 3x3 blur for noise reduction
        const blurRadius = Math.floor(this.settings.noiseReduction * 3);
        if (blurRadius > 0) {
          adjusted = this.applyBlur(data, width, height, i, blurRadius);
        }
      }
      
      // Clamp values
      adjusted = Math.max(0, Math.min(255, adjusted));
      
      // Set processed values
      processedData[i] = adjusted;     // R
      processedData[i + 1] = adjusted; // G
      processedData[i + 2] = adjusted; // B
      processedData[i + 3] = a;        // A
    }
    
    return { data: processedData, width, height };
  }

  private applyBlur(data: Uint8ClampedArray, width: number, height: number, index: number, radius: number): number {
    const x = (index / 4) % width;
    const y = Math.floor((index / 4) / width);
    
    let sum = 0;
    let count = 0;
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nIndex = (ny * width + nx) * 4;
          sum += data[nIndex];
          count++;
        }
      }
    }
    
    return count > 0 ? sum / count : data[index];
  }

  // Step Navigation
  nextStep(): void {
    if (this.currentStep < 3) {
      this.currentStep++;
      if (this.currentStep === 3) {
        this.startGeneration();
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // Settings and Preview
  updatePreview(): void {
    if (!this.processedImageData || !this.previewContext) return;

    const canvas = this.previewCanvas.nativeElement;
    const ctx = this.previewContext;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = this.settings.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw processed image
    this.drawProcessedImage(ctx, canvas.width, canvas.height);
    
    // Draw preview nails if enabled
    if (this.settings.showNails) {
      this.drawPreviewNails(ctx, canvas.width, canvas.height);
    }
  }

  private drawProcessedImage(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (!this.processedImageData) return;

    // Create temporary canvas for the processed image
    const tempCanvas = document.createElement('canvas');
    const tempContext = tempCanvas.getContext('2d')!;
    
    tempCanvas.width = this.processedImageData.width;
    tempCanvas.height = this.processedImageData.height;
    
    // Create ImageData from processed data
    const imageData = new ImageData(this.processedImageData.data, this.processedImageData.width, this.processedImageData.height);
    tempContext.putImageData(imageData, 0, 0);
    
    // Calculate aspect ratio for proper scaling
    const imgAspect = this.processedImageData.width / this.processedImageData.height;
    const canvasAspect = width / height;
    
    let drawWidth = width;
    let drawHeight = height;
    let offsetX = 0;
    let offsetY = 0;
    
    if (imgAspect > canvasAspect) {
      drawHeight = width / imgAspect;
      offsetY = (height - drawHeight) / 2;
    } else {
      drawWidth = height * imgAspect;
      offsetX = (width - drawWidth) / 2;
    }
    
    // Draw the processed image
    ctx.drawImage(tempCanvas, offsetX, offsetY, drawWidth, drawHeight);
  }

  private drawPreviewNails(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    
    ctx.fillStyle = '#667eea';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < this.settings.nailCount; i++) {
      const angle = (2 * Math.PI * i) / this.settings.nailCount;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  }

  // Estimation Methods
  getEstimatedTime(): string {
    const baseTime = this.settings.nailCount * this.settings.stringCount / 1000;
    const algorithmMultiplier = this.settings.algorithm === 'advanced' ? 2 : 
                               this.settings.algorithm === 'optimized' ? 1.5 : 1;
    const estimatedSeconds = Math.round(baseTime * algorithmMultiplier);
    
    if (estimatedSeconds < 60) {
      return `${estimatedSeconds}s`;
    } else {
      const minutes = Math.round(estimatedSeconds / 60);
      return `${minutes}m`;
    }
  }

  getEstimatedSize(): string {
    const baseSize = this.settings.nailCount * this.settings.stringCount / 100;
    const sizeKB = Math.round(baseSize);
    
    if (sizeKB < 1024) {
      return `${sizeKB} KB`;
    } else {
      const sizeMB = (sizeKB / 1024).toFixed(1);
      return `${sizeMB} MB`;
    }
  }

  getQualityScore(): number {
    let score = 5; // Base score
    
    // Nail count contribution
    score += Math.min(this.settings.nailCount / 20, 2);
    
    // String count contribution
    score += Math.min(this.settings.stringCount / 500, 2);
    
    // Algorithm contribution
    if (this.settings.algorithm === 'advanced') score += 1;
    else if (this.settings.algorithm === 'optimized') score += 0.5;
    
    return Math.min(Math.round(score), 10);
  }

  // Generation Process
  private async startGeneration(): Promise<void> {
    console.log('🚀 Starting generation...');
    console.log('Selected image:', !!this.selectedImage);
    console.log('Original image:', !!this.originalImage);
    console.log('Processed image data:', !!this.processedImageData);
    console.log('Result context:', !!this.resultContext);
    
    // Ensure result canvas is initialized
    this.initializeResultCanvas();
    
    this.generationComplete = false;
    this.generationProgress = 0;
    this.generationStatus = 'Analyzing image...';
    
    // Real generation process
    await this.generateStringArt();
    
    this.generationComplete = true;
    this.renderFinalResult();
    
    console.log('✅ Generation complete!');
  }

  private async generateStringArt(): Promise<void> {
    // Ensure we have processed image data, if not, process the original image
    if (!this.processedImageData && this.originalImage) {
      this.processImageData();
    }

    const steps = [
      { progress: 10, status: 'Analyzing image...' },
      { progress: 25, status: 'Calculating nail positions...' },
      { progress: 40, status: 'Generating string paths...' },
      { progress: 60, status: 'Optimizing string order...' },
      { progress: 80, status: 'Rendering final result...' },
      { progress: 100, status: 'Generation complete!' }
    ];

    for (const step of steps) {
      await this.delay(300 + Math.random() * 500);
      this.generationProgress = step.progress;
      this.generationStatus = step.status;
      
      // Update preview during generation
      if (step.progress >= 40) {
        this.updateLivePreview(step.progress);
      }
    }
  }

  private updateLivePreview(progress: number): void {
    console.log('🎨 Updating live preview, progress:', progress);
    
    // Ensure result canvas is initialized
    this.initializeResultCanvas();
    
    if (!this.resultContext) {
      console.log('❌ No result context available');
      return;
    }

    const canvas = this.resultCanvas.nativeElement;
    const ctx = this.resultContext;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = this.settings.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Generate partial string art based on progress
    const stringsToDraw = Math.floor((progress / 100) * this.settings.stringCount);
    console.log('📏 Drawing', stringsToDraw, 'strings out of', this.settings.stringCount);
    this.generatePartialStringArt(ctx, canvas.width, canvas.height, stringsToDraw);
    
    // Force canvas update
    ctx.stroke();
  }

  private generatePartialStringArt(ctx: CanvasRenderingContext2D, width: number, height: number, stringCount: number): void {
    console.log('🔧 Generating partial string art:', stringCount, 'strings');
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 30;
    
    // Generate nail positions
    const nails: Array<{x: number, y: number}> = [];
    for (let i = 0; i < this.settings.nailCount; i++) {
      const angle = (2 * Math.PI * i) / this.settings.nailCount;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      nails.push({ x, y });
    }
    
    console.log('📌 Generated', nails.length, 'nail positions');
    
    // Generate string paths based on image data or fallback to basic pattern
    let stringPaths: Array<{from: number, to: number}> = [];
    
    if (this.processedImageData) {
      console.log('🖼️ Using image-based string paths');
      console.log('📊 Image data available:', this.processedImageData.width, 'x', this.processedImageData.height);
      stringPaths = this.generateStringPathsFromImage(nails, stringCount);
    } else {
      console.log('🔄 Using basic pattern fallback');
      stringPaths = this.generateBasicStringPaths(nails, stringCount);
    }
    
    console.log('🧵 Generated', stringPaths.length, 'string paths');
    
    // Draw strings
    ctx.strokeStyle = this.settings.stringColor;
    ctx.lineWidth = this.settings.stringThickness;
    ctx.globalAlpha = this.settings.opacity;
    
    stringPaths.forEach((path, index) => {
      const fromNail = nails[path.from];
      const toNail = nails[path.to];
      
      ctx.beginPath();
      ctx.moveTo(fromNail.x, fromNail.y);
      ctx.lineTo(toNail.x, toNail.y);
      ctx.stroke();
      
      if (index < 5) { // Log first 5 strings for debugging
        console.log(`String ${index}: from (${fromNail.x}, ${fromNail.y}) to (${toNail.x}, ${toNail.y})`);
      }
    });
    
    // Draw nails if enabled
    if (this.settings.showNails) {
      ctx.fillStyle = '#667eea';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 1;
      
      nails.forEach(nail => {
        ctx.beginPath();
        ctx.arc(nail.x, nail.y, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      });
    }
    
    console.log('✅ Partial string art generation complete');
  }

  private generateBasicStringPaths(nails: Array<{x: number, y: number}>, stringCount: number): Array<{from: number, to: number}> {
    const paths: Array<{from: number, to: number}> = [];
    
    for (let i = 0; i < stringCount; i++) {
      const fromIndex = i % nails.length;
      const toIndex = (i + Math.floor(nails.length / 3)) % nails.length;
      paths.push({ from: fromIndex, to: toIndex });
    }
    
    return paths;
  }

  private generateStringPathsFromImage(nails: Array<{x: number, y: number}>, stringCount: number): Array<{from: number, to: number}> {
    if (!this.processedImageData) return [];

    const paths: Array<{from: number, to: number}> = [];
    const centerX = this.processedImageData.width / 2;
    const centerY = this.processedImageData.height / 2;
    const radius = Math.min(this.processedImageData.width, this.processedImageData.height) / 2 - 10;
    
    // Create a map of nail positions in image coordinates
    const nailPositions: Array<{x: number, y: number, index: number}> = [];
    for (let i = 0; i < this.settings.nailCount; i++) {
      const angle = (2 * Math.PI * i) / this.settings.nailCount;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      nailPositions.push({ x: Math.round(x), y: Math.round(y), index: i });
    }
    
    // Generate strings based on image brightness
    let attempts = 0;
    const maxAttempts = stringCount * 2; // Allow more attempts to find good paths
    
    for (let i = 0; i < stringCount && attempts < maxAttempts; i++) {
      // Find the best string path based on image data
      const path = this.findBestStringPath(nailPositions, i);
      if (path) {
        paths.push(path);
      } else {
        // If no path found, try a different approach
        const fromIndex = i % nails.length;
        const toIndex = (fromIndex + Math.floor(nails.length / 2) + i) % nails.length;
        paths.push({ from: fromIndex, to: toIndex });
      }
      attempts++;
    }
    
    // Ensure we have enough strings
    while (paths.length < stringCount) {
      const fromIndex = paths.length % nails.length;
      const toIndex = (fromIndex + Math.floor(nails.length / 3)) % nails.length;
      paths.push({ from: fromIndex, to: toIndex });
    }
    
    return paths;
  }

  private findBestStringPath(nails: Array<{x: number, y: number, index: number}>, stringIndex: number): {from: number, to: number} | null {
    if (!this.processedImageData) return null;

    const { data, width, height } = this.processedImageData;
    
    // For portrait images, we want to create patterns that follow the image content
    // Use different strategies based on string index to create varied patterns
    
    let fromIndex: number;
    let toIndex: number;
    
    // Create more varied patterns for better portrait representation
    const patternType = stringIndex % 4;
    
    switch (patternType) {
      case 0:
        // Radial patterns from center (30%)
        fromIndex = stringIndex % nails.length;
        toIndex = (fromIndex + Math.floor(nails.length / 2)) % nails.length;
        break;
      case 1:
        // Short cross patterns (25%)
        fromIndex = stringIndex % nails.length;
        toIndex = (fromIndex + Math.floor(nails.length / 6)) % nails.length;
        break;
      case 2:
        // Long diagonal patterns (25%)
        fromIndex = stringIndex % nails.length;
        toIndex = (fromIndex + Math.floor(nails.length / 3)) % nails.length;
        break;
      case 3:
        // Random patterns based on image content (20%)
        fromIndex = stringIndex % nails.length;
        toIndex = (fromIndex + Math.floor(nails.length / 4) + stringIndex) % nails.length;
        break;
    }
    
    // Sample brightness along the line
    const fromNail = nails[fromIndex];
    const toNail = nails[toIndex];
    const brightness = this.sampleLineBrightness(fromNail, toNail, data, width, height);
    
    // For portrait images, we want to draw strings in darker areas (lower brightness)
    // This will create the image features
    const threshold = 80 + (stringIndex % 40); // Lower threshold for more strings
    
    if (brightness < threshold) {
      return { from: fromIndex, to: toIndex };
    }
    
    // Include more structural strings for better coverage
    if (stringIndex % 5 === 0) {
      return { from: fromIndex, to: toIndex };
    }
    
    return null;
  }

  private sampleLineBrightness(from: {x: number, y: number}, to: {x: number, y: number}, data: Uint8ClampedArray, width: number, height: number): number {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    let totalBrightness = 0;
    let sampleCount = 0;
    
    // Sample more points along the line for better accuracy
    const samples = Math.max(20, Math.floor(distance / 3));
    
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = Math.round(from.x + t * dx);
      const y = Math.round(from.y + t * dy);
      
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const index = (y * width + x) * 4;
        // Use grayscale value (all channels are the same after processing)
        const brightness = data[index];
        totalBrightness += brightness;
        sampleCount++;
      }
    }
    
    // Return average brightness, but also consider the variance
    const avgBrightness = sampleCount > 0 ? totalBrightness / sampleCount : 0;
    
    // For portrait images, we want to favor areas with more contrast
    // So we'll adjust the brightness based on the line length and position
    const centerX = width / 2;
    const centerY = height / 2;
    const lineCenterX = (from.x + to.x) / 2;
    const lineCenterY = (from.y + to.y) / 2;
    
    // Boost brightness for lines that pass through the center (face area)
    const distanceFromCenter = Math.sqrt((lineCenterX - centerX) ** 2 + (lineCenterY - centerY) ** 2);
    const centerBoost = Math.max(0, 50 - distanceFromCenter / 2);
    
    return Math.min(255, avgBrightness + centerBoost);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private renderFinalResult(): void {
    // Use final result canvas for the completed result
    if (this.finalResultCanvas) {
      const canvas = this.finalResultCanvas.nativeElement;
      const ctx = canvas.getContext('2d')!;
      
      // Set canvas size
      canvas.width = 600;
      canvas.height = 600;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background
      ctx.fillStyle = this.settings.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Generate and draw final string art
      this.generateFinalStringArt(ctx, canvas.width, canvas.height);
      
      // Update result data with actual values
      const nailPositions = this.generateNailPositions(canvas.width, canvas.height);
      const stringPaths = this.generateStringPaths();
      
      this.resultData = {
        nailCount: this.settings.nailCount,
        stringCount: this.settings.stringCount,
        generationTime: Math.round(this.settings.nailCount * this.settings.stringCount / 1000),
        fileSize: this.getEstimatedSize(),
        nailPositions: nailPositions,
        stringPaths: stringPaths,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        centerX: canvas.width / 2,
        centerY: canvas.height / 2,
        radius: Math.min(canvas.width, canvas.height) / 2 - 30
      };
      
      // Force canvas update
      ctx.stroke();
    }
  }

  private generateFinalStringArt(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 30;
    
    // Generate nail positions
    const nails: Array<{x: number, y: number}> = [];
    for (let i = 0; i < this.settings.nailCount; i++) {
      const angle = (2 * Math.PI * i) / this.settings.nailCount;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      nails.push({ x, y });
    }
    
    // Generate string paths based on image data or fallback to basic pattern
    let stringPaths: Array<{from: number, to: number}> = [];
    
    if (this.processedImageData) {
      stringPaths = this.generateStringPathsFromImage(nails, this.settings.stringCount);
    } else {
      // Fallback: generate basic pattern
      stringPaths = this.generateBasicStringPaths(nails, this.settings.stringCount);
    }
    
    // Draw strings
    ctx.strokeStyle = this.settings.stringColor;
    ctx.lineWidth = this.settings.stringThickness;
    ctx.globalAlpha = this.settings.opacity;
    
    stringPaths.forEach(path => {
      const fromNail = nails[path.from];
      const toNail = nails[path.to];
      
      ctx.beginPath();
      ctx.moveTo(fromNail.x, fromNail.y);
      ctx.lineTo(toNail.x, toNail.y);
      ctx.stroke();
    });
    
    // Draw nails if enabled
    if (this.settings.showNails) {
      ctx.fillStyle = '#667eea';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 1;
      
      nails.forEach(nail => {
        ctx.beginPath();
        ctx.arc(nail.x, nail.y, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      });
    }
  }

  private generateNailPositions(width: number, height: number): Array<{x: number, y: number, index: number}> {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 30;
    const nails: Array<{x: number, y: number, index: number}> = [];
    
    for (let i = 0; i < this.settings.nailCount; i++) {
      const angle = (2 * Math.PI * i) / this.settings.nailCount;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      nails.push({ x: Math.round(x), y: Math.round(y), index: i + 1 });
    }
    
    return nails;
  }

  private generateStringPaths(): Array<{from: number, to: number, order: number}> {
    const paths: Array<{from: number, to: number, order: number}> = [];
    
    for (let i = 0; i < this.settings.stringCount; i++) {
      const fromNail = (i % this.settings.nailCount) + 1;
      const toNail = ((i + Math.floor(this.settings.nailCount / 3)) % this.settings.nailCount) + 1;
      paths.push({ from: fromNail, to: toNail, order: i + 1 });
    }
    
    return paths;
  }

  // Zoom Controls
  zoomIn(): void {
    this.zoomLevel = Math.min(this.zoomLevel * 1.2, 3);
    this.applyZoom();
  }

  zoomOut(): void {
    this.zoomLevel = Math.max(this.zoomLevel / 1.2, 0.5);
    this.applyZoom();
  }

  resetZoom(): void {
    this.zoomLevel = 1;
    this.applyZoom();
  }

  private applyZoom(): void {
    if (this.resultCanvas) {
      const canvas = this.resultCanvas.nativeElement;
      canvas.style.transform = `scale(${this.zoomLevel})`;
      canvas.style.transformOrigin = 'center center';
    }
  }

  // Enhanced Download Methods
  downloadSVG(): void {
    if (!this.resultContext) return;
    
    const canvas = this.resultCanvas.nativeElement;
    const svgData = this.canvasToSVG(canvas);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'string-art.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  downloadInstructions(): void {
    const instructions = this.generateDetailedInstructions();
    const blob = new Blob([instructions], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'string-art-instructions.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  downloadImage(): void {
    if (!this.resultCanvas) return;
    
    const canvas = this.resultCanvas.nativeElement;
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'string-art.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  }

  downloadCoordinates(): void {
    const coordinates = this.generateCoordinateFile();
    const blob = new Blob([coordinates], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'string-art-coordinates.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Save Project to Backend
  saveProject(): void {
    if (!this.selectedImage || !this.generationComplete) {
      this.saveError = 'Please complete the string art generation first.';
      return;
    }

    if (!this.projectTitle.trim()) {
      this.saveError = 'Please enter a project title.';
      return;
    }

    this.isSaving = true;
    this.saveError = '';
    this.saveSuccess = false;

    // Get the generated image as base64
    const canvas = this.finalResultCanvas ? this.finalResultCanvas.nativeElement : this.resultCanvas.nativeElement;
    const generatedImage = canvas.toDataURL('image/png');

    const project: StringArtProject = {
      title: this.projectTitle.trim(),
      description: this.projectDescription.trim(),
      originalImage: this.selectedImage,
      settings: this.settings,
      result: this.resultData,
      generatedImage: generatedImage
    };

    this.stringArtService.saveProject(project).subscribe({
      next: (response) => {
        this.isSaving = false;
        if (response.success) {
          this.saveSuccess = true;
          this.saveError = '';
          // Reset form after successful save
          setTimeout(() => {
            this.saveSuccess = false;
            this.projectTitle = '';
            this.projectDescription = '';
          }, 3000);
        } else {
          this.saveError = response.error || 'Failed to save project.';
        }
      },
      error: (error) => {
        this.isSaving = false;
        this.saveError = 'Network error. Please try again.';
        console.error('Save project error:', error);
      }
    });
  }

  private canvasToSVG(canvas: HTMLCanvasElement): string {
    const width = canvas.width;
    const height = canvas.height;
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="${width}" height="${height}" fill="${this.settings.backgroundColor}"/>`;
    
    // Convert canvas content to SVG paths (simplified)
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 30;
    
    // Generate nail positions
    const nails: Array<{x: number, y: number}> = [];
    for (let i = 0; i < this.settings.nailCount; i++) {
      const angle = (2 * Math.PI * i) / this.settings.nailCount;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      nails.push({ x, y });
    }
    
    // Add string lines
    for (let i = 0; i < this.settings.stringCount; i++) {
      const fromNail = nails[i % nails.length];
      const toNail = nails[(i + Math.floor(this.settings.nailCount / 3)) % nails.length];
      
      svg += `<line x1="${fromNail.x}" y1="${fromNail.y}" x2="${toNail.x}" y2="${toNail.y}" `;
      svg += `stroke="${this.settings.stringColor}" stroke-width="${this.settings.stringThickness}" opacity="${this.settings.opacity}"/>`;
    }
    
    // Add nails if enabled
    if (this.settings.showNails) {
      nails.forEach(nail => {
        svg += `<circle cx="${nail.x}" cy="${nail.y}" r="4" fill="#667eea" stroke="#ffffff" stroke-width="2"/>`;
      });
    }
    
    svg += '</svg>';
    return svg;
  }

  private generateDetailedInstructions(): string {
    let instructions = 'STRING ART INSTRUCTIONS\n';
    instructions += '========================\n\n';
    instructions += `Project: ${this.projectTitle || 'String Art Generation'}\n`;
    instructions += `Generated: ${new Date().toLocaleString()}\n\n`;
    instructions += `SETTINGS:\n`;
    instructions += `- Nails: ${this.settings.nailCount}\n`;
    instructions += `- Strings: ${this.settings.stringCount}\n`;
    instructions += `- Algorithm: ${this.settings.algorithm}\n`;
    instructions += `- String Color: ${this.settings.stringColor}\n`;
    instructions += `- Background: ${this.settings.backgroundColor}\n`;
    instructions += `- String Thickness: ${this.settings.stringThickness}px\n`;
    instructions += `- Opacity: ${(this.settings.opacity * 100).toFixed(0)}%\n\n`;
    
    instructions += `MATERIALS NEEDED:\n`;
    instructions += `- Wooden board or canvas (recommended size: 30cm x 30cm)\n`;
    instructions += `- ${this.settings.nailCount} small nails (1-2cm length)\n`;
    instructions += `- String or thread in color: ${this.settings.stringColor}\n`;
    instructions += `- Hammer\n`;
    instructions += `- Ruler or measuring tape\n`;
    instructions += `- Pencil for marking\n`;
    instructions += `- Scissors\n\n`;
    
    instructions += `NAIL POSITIONS:\n`;
    instructions += `Circle radius: 15cm (from center)\n`;
    instructions += `Center point: (15cm, 15cm) from top-left corner\n\n`;
    
    this.resultData.nailPositions.forEach(nail => {
      const angle = ((nail.index - 1) * 360 / this.settings.nailCount);
      instructions += `Nail ${nail.index}: (${nail.x}px, ${nail.y}px) - Angle: ${angle.toFixed(1)}°\n`;
    });
    
    instructions += `\nSTRING PATHS (in order):\n`;
    this.resultData.stringPaths.forEach(path => {
      instructions += `String ${path.order}: From nail ${path.from} to nail ${path.to}\n`;
    });
    
    instructions += `\nSTEP-BY-STEP INSTRUCTIONS:\n`;
    instructions += `1. Mark the center point on your board (15cm from each edge)\n`;
    instructions += `2. Draw a circle with 15cm radius around the center\n`;
    instructions += `3. Mark ${this.settings.nailCount} evenly spaced points on the circle\n`;
    instructions += `4. Hammer nails at each marked position\n`;
    instructions += `5. Number the nails from 1 to ${this.settings.nailCount} clockwise\n`;
    instructions += `6. Tie the string to nail 1\n`;
    instructions += `7. Follow the string paths in order:\n`;
    
    this.resultData.stringPaths.slice(0, 10).forEach(path => {
      instructions += `   - String ${path.order}: Go from nail ${path.from} to nail ${path.to}\n`;
    });
    
    if (this.resultData.stringPaths.length > 10) {
      instructions += `   ... and ${this.resultData.stringPaths.length - 10} more strings\n`;
    }
    
    instructions += `8. Keep string tension consistent throughout\n`;
    instructions += `9. Secure string at each nail as you go\n`;
    instructions += `10. Tie off final string and trim excess\n\n`;
    
    instructions += `TIPS FOR SUCCESS:\n`;
    instructions += `- Work in good lighting\n`;
    instructions += `- Keep string tension consistent\n`;
    instructions += `- Double-check nail positions before hammering\n`;
    instructions += `- Take breaks if needed\n`;
    instructions += `- Use a ruler to ensure accurate measurements\n`;
    instructions += `- Start with the outer nails and work inward\n`;
    
    return instructions;
  }

  private generateCoordinateFile(): string {
    let coordinates = 'STRING ART COORDINATES\n';
    coordinates += '======================\n\n';
    coordinates += `Project: ${this.projectTitle || 'String Art Generation'}\n`;
    coordinates += `Generated: ${new Date().toLocaleString()}\n`;
    coordinates += `Canvas Size: ${this.resultData.canvasWidth} x ${this.resultData.canvasHeight} pixels\n`;
    coordinates += `Center: (${this.resultData.centerX}, ${this.resultData.centerY})\n`;
    coordinates += `Radius: ${this.resultData.radius} pixels\n\n`;
    
    coordinates += `NAIL POSITIONS:\n`;
    coordinates += `Format: Nail_Number, X_Coordinate, Y_Coordinate, Angle_Degrees\n\n`;
    
    this.resultData.nailPositions.forEach(nail => {
      const angle = ((nail.index - 1) * 360 / this.settings.nailCount);
      coordinates += `${nail.index}, ${nail.x}, ${nail.y}, ${angle.toFixed(2)}\n`;
    });
    
    coordinates += `\nSTRING PATHS:\n`;
    coordinates += `Format: String_Order, From_Nail, To_Nail, From_X, From_Y, To_X, To_Y\n\n`;
    
    this.resultData.stringPaths.forEach(path => {
      const fromNail = this.resultData.nailPositions.find(n => n.index === path.from);
      const toNail = this.resultData.nailPositions.find(n => n.index === path.to);
      
      if (fromNail && toNail) {
        coordinates += `${path.order}, ${path.from}, ${path.to}, ${fromNail.x}, ${fromNail.y}, ${toNail.x}, ${toNail.y}\n`;
      }
    });
    
    coordinates += `\nSETTINGS:\n`;
    coordinates += `Nail_Count: ${this.settings.nailCount}\n`;
    coordinates += `String_Count: ${this.settings.stringCount}\n`;
    coordinates += `String_Color: ${this.settings.stringColor}\n`;
    coordinates += `Background_Color: ${this.settings.backgroundColor}\n`;
    coordinates += `String_Thickness: ${this.settings.stringThickness}\n`;
    coordinates += `Opacity: ${this.settings.opacity}\n`;
    
    return coordinates;
  }

  // Utility Methods
  shareProject(): void {
    // Implement sharing functionality
    alert('Sharing functionality will be implemented in the next version!');
  }

  createNewProject(): void {
    this.currentStep = 1;
    this.selectedImage = null;
    this.originalImage = null;
    this.processedImageData = null;
    this.generationComplete = false;
    this.generationProgress = 0;
    this.zoomLevel = 1;
    this.projectTitle = '';
    this.projectDescription = '';
    this.saveSuccess = false;
    this.saveError = '';
    
    // Reset settings to defaults
    this.settings = {
      nailCount: 60,
      stringCount: 500,
      algorithm: 'optimized',
      stringColor: '#000000',
      backgroundColor: '#ffffff',
      stringThickness: 2,
      opacity: 0.8,
      contrast: 1.0,
      brightness: 1.0,
      noiseReduction: 0.2,
      showNails: true,
      autoOptimize: true
    };
    
    this.initializeCanvases();
  }
} 