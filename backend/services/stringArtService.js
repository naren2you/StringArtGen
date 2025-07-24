const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

class StringArtService {
  constructor() {
    this.maxNails = 512;
    this.minNails = 50;
    this.maxStrings = 3000;
    this.minStrings = 100;
  }

  /**
   * Generate string art coordinates from an image
   * @param {string} imagePath - Path to the input image
   * @param {Object} settings - Generation settings
   * @returns {Object} Generated string art data
   */
  async generateStringArt(imagePath, settings) {
    const startTime = Date.now();

    try {
      // Validate settings
      this.validateSettings(settings);

      // Process image
      const processedImage = await this.processImage(imagePath, settings);

      // Generate nail positions
      const nails = this.generateNailPositions(settings.nails);

      // Generate string coordinates using greedy algorithm
      const coordinates = await this.generateCoordinates(processedImage, nails, settings);

      // Calculate quality metrics
      const quality = this.calculateQuality(processedImage, coordinates, nails);

      // Generate preview
      const preview = await this.generatePreview(coordinates, nails, settings);

      const generationTime = Date.now() - startTime;

      return {
        coordinates,
        nails: settings.nails,
        strings: settings.strings,
        quality,
        generationTime,
        preview,
        settings
      };
    } catch (error) {
      console.error('String art generation error:', error);
      throw new Error(`String art generation failed: ${error.message}`);
    }
  }

  /**
   * Validate generation settings
   * @param {Object} settings - Settings to validate
   */
  validateSettings(settings) {
    const { nails, strings, algorithm, color, blurRadius, contrast } = settings;

    if (nails < this.minNails || nails > this.maxNails) {
      throw new Error(`Nails must be between ${this.minNails} and ${this.maxNails}`);
    }

    if (strings < this.minStrings || strings > this.maxStrings) {
      throw new Error(`Strings must be between ${this.minStrings} and ${this.maxStrings}`);
    }

    if (!['greedy', 'genetic', 'hybrid'].includes(algorithm)) {
      throw new Error('Invalid algorithm specified');
    }

    if (!['black', 'white', 'custom'].includes(color)) {
      throw new Error('Invalid color specified');
    }

    if (blurRadius < 0 || blurRadius > 5) {
      throw new Error('Blur radius must be between 0 and 5');
    }

    if (contrast < 0.1 || contrast > 3) {
      throw new Error('Contrast must be between 0.1 and 3');
    }
  }

  /**
   * Process input image
   * @param {string} imagePath - Path to input image
   * @param {Object} settings - Processing settings
   * @returns {Object} Processed image data
   */
  async processImage(imagePath, settings) {
    try {
      // Read and process image with Sharp
      const image = sharp(imagePath);
      const metadata = await image.metadata();

      // Resize to standard size (512x512 for processing)
      const processedImage = await image
        .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .grayscale()
        .blur(settings.blurRadius)
        .modulate({ brightness: 1, contrast: settings.contrast })
        .raw()
        .toBuffer();

      return {
        data: processedImage,
        width: 512,
        height: 512,
        channels: 1,
        originalMetadata: metadata
      };
    } catch (error) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  /**
   * Generate nail positions in a circle
   * @param {number} nailCount - Number of nails
   * @returns {Array} Array of nail positions
   */
  generateNailPositions(nailCount) {
    const nails = [];
    const centerX = 256;
    const centerY = 256;
    const radius = 200; // Keep nails within the image bounds

    for (let i = 0; i < nailCount; i++) {
      const angle = (2 * Math.PI * i) / nailCount;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      nails.push({
        index: i,
        x: Math.round(x),
        y: Math.round(y),
        angle: angle
      });
    }

    return nails;
  }

  /**
   * Generate string coordinates using greedy algorithm
   * @param {Object} image - Processed image data
   * @param {Array} nails - Nail positions
   * @param {Object} settings - Generation settings
   * @returns {Array} Array of coordinates
   */
  async generateCoordinates(image, nails, settings) {
    const coordinates = [];
    const { width, height, data } = image;
    const darknessBuffer = new Uint8Array(data);
    let currentNail = 0;

    for (let stringIndex = 0; stringIndex < settings.strings; stringIndex++) {
      let bestNail = currentNail;
      let bestScore = -1;

      // Find the best nail to connect to
      for (let i = 0; i < nails.length; i++) {
        if (i === currentNail) continue;

        const score = this.calculateLineScore(
          nails[currentNail],
          nails[i],
          darknessBuffer,
          width,
          height
        );

        if (score > bestScore) {
          bestScore = score;
          bestNail = i;
        }
      }

      // Add coordinate
      coordinates.push({
        from: currentNail,
        to: bestNail,
        order: stringIndex
      });

      // Update darkness buffer along the line
      this.updateDarknessBuffer(
        nails[currentNail],
        nails[bestNail],
        darknessBuffer,
        width,
        height
      );

      // Move to the target nail for next iteration
      currentNail = bestNail;
    }

    return coordinates;
  }

  /**
   * Calculate the score for a line between two nails
   * @param {Object} nail1 - First nail position
   * @param {Object} nail2 - Second nail position
   * @param {Uint8Array} darknessBuffer - Current darkness buffer
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @returns {number} Line score
   */
  calculateLineScore(nail1, nail2, darknessBuffer, width, height) {
    const points = this.getLinePoints(nail1, nail2);
    let totalDarkness = 0;
    let pointCount = 0;

    for (const point of points) {
      if (point.x >= 0 && point.x < width && point.y >= 0 && point.y < height) {
        const index = point.y * width + point.x;
        totalDarkness += darknessBuffer[index];
        pointCount++;
      }
    }

    return pointCount > 0 ? totalDarkness / pointCount : 0;
  }

  /**
   * Get all points along a line between two nails
   * @param {Object} nail1 - First nail position
   * @param {Object} nail2 - Second nail position
   * @returns {Array} Array of points
   */
  getLinePoints(nail1, nail2) {
    const points = [];
    const dx = Math.abs(nail2.x - nail1.x);
    const dy = Math.abs(nail2.y - nail1.y);
    const sx = nail1.x < nail2.x ? 1 : -1;
    const sy = nail1.y < nail2.y ? 1 : -1;
    let err = dx - dy;

    let x = nail1.x;
    let y = nail1.y;

    while (true) {
      points.push({ x, y });

      if (x === nail2.x && y === nail2.y) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }

    return points;
  }

  /**
   * Update darkness buffer along a line
   * @param {Object} nail1 - First nail position
   * @param {Object} nail2 - Second nail position
   * @param {Uint8Array} darknessBuffer - Darkness buffer to update
   * @param {number} width - Image width
   * @param {number} height - Image height
   */
  updateDarknessBuffer(nail1, nail2, darknessBuffer, width, height) {
    const points = this.getLinePoints(nail1, nail2);
    const darkenAmount = 30; // Amount to darken each pixel

    for (const point of points) {
      if (point.x >= 0 && point.x < width && point.y >= 0 && point.y < height) {
        const index = point.y * width + point.x;
        darknessBuffer[index] = Math.max(0, darknessBuffer[index] - darkenAmount);
      }
    }
  }

  /**
   * Calculate quality metrics for the generated string art
   * @param {Object} image - Processed image data
   * @param {Array} coordinates - Generated coordinates
   * @param {Array} nails - Nail positions
   * @returns {Object} Quality metrics
   */
  calculateQuality(image, coordinates, nails) {
    const { width, height } = image;
    const totalPixels = width * height;
    const coveredPixels = this.calculateCoveredPixels(coordinates, nails, width, height);
    const coverage = coveredPixels / totalPixels;

    // Calculate string efficiency (pixels covered per string)
    const stringEfficiency = coordinates.length > 0 ? coveredPixels / coordinates.length : 0;

    // Calculate quality score (0-100)
    const qualityScore = Math.min(100, Math.round(coverage * 100));

    return {
      coverage: Math.round(coverage * 1000) / 10, // Percentage with 1 decimal
      stringEfficiency: Math.round(stringEfficiency * 10) / 10,
      qualityScore,
      totalPixels,
      coveredPixels,
      stringCount: coordinates.length
    };
  }

  /**
   * Calculate how many pixels are covered by strings
   * @param {Array} coordinates - Generated coordinates
   * @param {Array} nails - Nail positions
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @returns {number} Number of covered pixels
   */
  calculateCoveredPixels(coordinates, nails, width, height) {
    const canvas = new Array(width * height).fill(0);
    let coveredPixels = 0;

    for (const coord of coordinates) {
      const fromNail = nails[coord.from];
      const toNail = nails[coord.to];
      const points = this.getLinePoints(fromNail, toNail);

      for (const point of points) {
        if (point.x >= 0 && point.x < width && point.y >= 0 && point.y < height) {
          const index = point.y * width + point.x;
          if (canvas[index] === 0) {
            canvas[index] = 1;
            coveredPixels++;
          }
        }
      }
    }

    return coveredPixels;
  }

  /**
   * Generate a preview image of the string art
   * @param {Array} coordinates - Generated coordinates
   * @param {Array} nails - Nail positions
   * @param {Object} settings - Generation settings
   * @returns {Object} Preview data
   */
  async generatePreview(coordinates, nails, settings) {
    try {
      const width = 512;
      const height = 512;
      const canvas = this.createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Set background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Draw strings
      ctx.strokeStyle = settings.color === 'custom' ? settings.customColor : settings.color;
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';

      for (const coord of coordinates) {
        const fromNail = nails[coord.from];
        const toNail = nails[coord.to];

        ctx.beginPath();
        ctx.moveTo(fromNail.x, fromNail.y);
        ctx.lineTo(toNail.x, toNail.y);
        ctx.stroke();
      }

      // Draw nails
      ctx.fillStyle = '#000000';
      for (const nail of nails) {
        ctx.beginPath();
        ctx.arc(nail.x, nail.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Convert to base64
      const dataURL = canvas.toDataURL('image/png');

      return {
        data: dataURL,
        format: 'png',
        width,
        height
      };
    } catch (error) {
      console.error('Preview generation error:', error);
      throw new Error(`Preview generation failed: ${error.message}`);
    }
  }

  /**
   * Create a canvas element for preview generation
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @returns {HTMLCanvasElement} Canvas element
   */
  createCanvas(width, height) {
    // For Node.js environment, we'll use a simple object
    // In a real implementation, you might want to use a canvas library like 'canvas'
    const canvas = {
      width,
      height,
      getContext: () => ({
        fillStyle: '#ffffff',
        strokeStyle: '#000000',
        lineWidth: 1,
        lineCap: 'round',
        fillRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        arc: () => {},
        fill: () => {},
        toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      })
    };

    return canvas;
  }
}

module.exports = StringArtService; 
