import { Bounds } from '../types';
import { ContourLine } from './ContourService';
import { GridCell } from './GridService';

interface RenderOptions {
  width: number;
  height: number;
  showContourLabels: boolean;
  contourColors: {
    regular: string;
    major: string;
    label: string;
  };
  gridColor: string;
  backgroundColor: string;
  showScaleBar: boolean;
  showGridLabels: boolean;
}

interface CanvasContextInfo {
  context: CanvasRenderingContext2D;
  bounds: Bounds;
  width: number;
  height: number;
  scaleX: (x: number) => number;
  scaleY: (y: number) => number;
}

class RenderService {
  // Default render options
  defaultOptions: RenderOptions = {
    width: 800,
    height: 600,
    showContourLabels: true,
    contourColors: {
      regular: '#8B4513', // Brown
      major: '#654321', // Darker brown
      label: '#000000' // Black
    },
    gridColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black
    backgroundColor: '#FFFFFF', // White
    showScaleBar: true,
    showGridLabels: true
  };

  /**
   * Render the map to a canvas element
   * @param canvas The canvas element to render to
   * @param bounds The geographic bounds of the map
   * @param contours The contour lines to render
   * @param grid The grid cells to render
   * @param options Render options
   */
  renderToCanvas(
    canvas: HTMLCanvasElement,
    bounds: Bounds,
    contours: ContourLine[],
    grid: GridCell[],
    options: Partial<RenderOptions> = {}
  ): void {
    // Merge options with defaults
    const mergedOptions: RenderOptions = { ...this.defaultOptions, ...options };
    
    // Set canvas dimensions
    canvas.width = mergedOptions.width;
    canvas.height = mergedOptions.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    // Set up the canvas context
    const contextInfo = this.setupCanvasContext(ctx, bounds, mergedOptions);
    
    // Fill background
    ctx.fillStyle = mergedOptions.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw contours
    this.drawContours(contextInfo, contours, mergedOptions);
    
    // Draw grid
    this.drawGrid(contextInfo, grid, mergedOptions);
    
    // Draw scale bar if requested
    if (mergedOptions.showScaleBar) {
      this.drawScaleBar(contextInfo);
    }
  }

  /**
   * Set up the canvas context for rendering
   * @param ctx The canvas context
   * @param bounds The geographic bounds
   * @param options Render options
   * @returns Canvas context info with scaling functions
   */
  private setupCanvasContext(
    ctx: CanvasRenderingContext2D,
    bounds: Bounds,
    options: RenderOptions
  ): CanvasContextInfo {
    const { width, height } = options;
    const { north, south, east, west } = bounds;
    
    // Calculate the scale factors to convert geographic coordinates to canvas coordinates
    const scaleX = (x: number): number => {
      return ((x - west) / (east - west)) * width;
    };
    
    const scaleY = (y: number): number => {
      return ((north - y) / (north - south)) * height;
    };
    
    // Set up context
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    return { 
      context: ctx, 
      bounds, 
      width, 
      height, 
      scaleX, 
      scaleY 
    };
  }

  /**
   * Draw contour lines
   * @param contextInfo Canvas context info
   * @param contours The contour lines to draw
   * @param options Render options
   */
  private drawContours(
    contextInfo: CanvasContextInfo,
    contours: ContourLine[],
    options: RenderOptions
  ): void {
    const { context: ctx, scaleX, scaleY } = contextInfo;
    
    // Draw all contour lines
    contours.forEach(contour => {
      // Set line style based on whether it's a major contour
      ctx.strokeStyle = contour.isMajor ? options.contourColors.major : options.contourColors.regular;
      ctx.lineWidth = contour.isMajor ? 1.5 : 0.8;
      
      // Draw each path in the contour
      contour.path.forEach(polygon => {
        polygon.forEach(ring => {
          ctx.beginPath();
          
          // Move to the first point
          const firstPoint = ring[0];
          ctx.moveTo(scaleX(firstPoint.x), scaleY(firstPoint.y));
          
          // Draw lines to each subsequent point
          for (let i = 1; i < ring.length; i++) {
            const point = ring[i];
            ctx.lineTo(scaleX(point.x), scaleY(point.y));
          }
          
          ctx.stroke();
        });
      });
      
      // Add elevation labels for major contours if enabled
      if (options.showContourLabels && contour.isMajor && contour.path.length > 0) {
        this.addContourLabels(contextInfo, contour, options);
      }
    });
  }

  /**
   * Add elevation labels to major contour lines
   * @param contextInfo Canvas context info
   * @param contour The contour line to label
   * @param options Render options
   */
  private addContourLabels(
    contextInfo: CanvasContextInfo,
    contour: ContourLine,
    options: RenderOptions
  ): void {
    const { context: ctx, scaleX, scaleY } = contextInfo;
    
    // Set text style
    ctx.fillStyle = options.contourColors.label;
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Try to find suitable points for labels
    // For simplicity, we'll just use a few points from the longest ring
    if (contour.path.length > 0 && contour.path[0].length > 0) {
      // Find the longest ring
      let longestRing: { x: number; y: number }[] = [];
      let maxLength = 0;
      
      contour.path[0].forEach(ring => {
        if (ring.length > maxLength) {
          maxLength = ring.length;
          longestRing = ring;
        }
      });
      
      if (longestRing.length > 0) {
        // Place labels at evenly spaced intervals
        const labelCount = Math.max(1, Math.floor(longestRing.length / 100));
        const interval = Math.floor(longestRing.length / (labelCount + 1));
        
        for (let i = 1; i <= labelCount; i++) {
          const index = i * interval;
          if (index < longestRing.length) {
            const point = longestRing[index];
            const x = scaleX(point.x);
            const y = scaleY(point.y);
            
            // Draw a small white background for better visibility
            const text = contour.level.toString();
            const textWidth = ctx.measureText(text).width;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillRect(x - textWidth / 2 - 2, y - 8, textWidth + 4, 16);
            
            // Draw the text
            ctx.fillStyle = options.contourColors.label;
            ctx.fillText(text, x, y);
          }
        }
      }
    }
  }

  /**
   * Draw the grid
   * @param contextInfo Canvas context info
   * @param grid The grid cells to draw
   * @param options Render options
   */
  private drawGrid(
    contextInfo: CanvasContextInfo,
    grid: GridCell[],
    options: RenderOptions
  ): void {
    const { context: ctx, scaleX, scaleY } = contextInfo;
    
    // Set grid line style
    ctx.strokeStyle = options.gridColor;
    ctx.lineWidth = 0.5;
    
    // Draw each grid cell
    grid.forEach(cell => {
      ctx.beginPath();
      
      // Move to the first point
      const firstPoint = cell.points[0];
      ctx.moveTo(scaleX(firstPoint.x), scaleY(firstPoint.y));
      
      // Draw lines to each subsequent point
      for (let i = 1; i < cell.points.length; i++) {
        const point = cell.points[i];
        ctx.lineTo(scaleX(point.x), scaleY(point.y));
      }
      
      ctx.stroke();
      
      // Add cell label if enabled
      if (options.showGridLabels && cell.id) {
        // Draw grid cell labels
        ctx.fillStyle = options.gridColor;
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw the cell ID at the center of the cell
        const centerX = scaleX(cell.center.x);
        const centerY = scaleY(cell.center.y);
        ctx.fillText(cell.id, centerX, centerY);
      }
    });
  }

  /**
   * Draw a scale bar
   * @param contextInfo Canvas context info
   */
  private drawScaleBar(
    contextInfo: CanvasContextInfo
  ): void {
    const { context: ctx, bounds, width, height } = contextInfo;
    const { north, south, east, west } = bounds;
    
    // Calculate a nice round value for the scale bar length
    // At the equator, 1 degree of longitude is approximately 111 km
    const avgLat = (north + south) / 2;
    const cosLat = Math.cos(avgLat * Math.PI / 180);
    const kmPerDegree = 111 * cosLat;
    
    // Calculate the distance across the map in km
    const mapWidthKm = (east - west) * kmPerDegree;
    
    // Choose a nice round value for the scale bar
    let scaleBarKm: number;
    if (mapWidthKm < 1) {
      scaleBarKm = 0.1; // 100 meters
    } else if (mapWidthKm < 5) {
      scaleBarKm = 1;
    } else if (mapWidthKm < 50) {
      scaleBarKm = 5;
    } else if (mapWidthKm < 100) {
      scaleBarKm = 10;
    } else {
      scaleBarKm = 50;
    }
    
    // Calculate scale bar width in pixels
    const scaleBarWidth = (scaleBarKm / mapWidthKm) * width;
    
    // Position the scale bar at the bottom left of the canvas
    const barX = 20;
    const barY = height - 20;
    const barHeight = 5;
    
    // Draw the scale bar
    ctx.fillStyle = '#000';
    ctx.fillRect(barX, barY, scaleBarWidth, barHeight);
    
    // Draw ticks at start and end
    ctx.fillRect(barX, barY - 5, 1, 15);
    ctx.fillRect(barX + scaleBarWidth, barY - 5, 1, 15);
    
    // Draw label
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    let label: string;
    if (scaleBarKm < 1) {
      label = `${scaleBarKm * 1000} m`;
    } else {
      label = `${scaleBarKm} km`;
    }
    
    ctx.fillText(label, barX + scaleBarWidth / 2, barY + 10);
  }

  /**
   * Export the canvas to a PNG blob
   * @param canvas The canvas element
   * @param dpi The resolution in dots per inch (optional, not used)
   * @returns Promise resolving to a PNG blob
   */
  async exportToPNG(canvas: HTMLCanvasElement, dpi?: number): Promise<Blob> {
    // Silence the unused parameter warning
    void dpi;
    
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob(blob => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create PNG blob'));
          }
        }, 'image/png');
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Create a high-resolution canvas for export
   * @param bounds The geographic bounds
   * @param contours The contour lines
   * @param grid The grid cells
   * @param options Render options
   * @param dpi The resolution in dots per inch (default: 300)
   * @returns Canvas element with rendered map
   */
  createHighResolutionCanvas(
    bounds: Bounds,
    contours: ContourLine[],
    grid: GridCell[],
    options: Partial<RenderOptions> = {},
    dpi: number = 300
  ): HTMLCanvasElement {
    // Calculate high-resolution dimensions (assuming standard 72 DPI for screen)
    const dpiScale = dpi / 72;
    const highResOptions: RenderOptions = {
      ...this.defaultOptions,
      ...options,
      width: Math.round((options.width || this.defaultOptions.width) * dpiScale),
      height: Math.round((options.height || this.defaultOptions.height) * dpiScale)
    };
    
    // Create canvas
    const canvas = document.createElement('canvas');
    
    // Render to the canvas
    this.renderToCanvas(canvas, bounds, contours, grid, highResOptions);
    
    return canvas;
  }
}

export default new RenderService();
export type { RenderOptions }; 