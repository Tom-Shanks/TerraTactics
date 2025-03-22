import * as d3 from 'd3';
import { ElevationData } from './ElevationService';

interface ContourPoint {
  x: number;
  y: number;
}

// A path is an array of points that form a line
type ContourPath = ContourPoint[];

// A polygon is an array of paths (outer path + holes)
type ContourPolygon = ContourPath[];

export interface ContourLine {
  elevation: number;
  coordinates: number[][][]; // Array of rings, each with points, each with [lng, lat]
}

class ContourService {
  /**
   * Generate contour lines from elevation data
   * @param elevationData The elevation data to generate contours from
   * @param interval The contour interval in meters
   */
  generateContours(elevationData: ElevationData, interval: number = 10): ContourLine[] {
    console.log(`Generating contours with interval: ${interval}m`);
    
    const { data, width, height, bounds, minElevation, maxElevation } = elevationData;
    
    // Create contour thresholds at specified interval
    const thresholds: number[] = [];
    const baseElevation = Math.floor(minElevation / interval) * interval;
    
    for (let i = baseElevation; i <= maxElevation; i += interval) {
      thresholds.push(i);
    }
    
    console.log(`Generating ${thresholds.length} contour levels from ${baseElevation}m to ${maxElevation}m`);
    
    // For now, we'll use a simplified algorithm to create contours
    // In a real implementation, you would use D3-contour or a similar library
    const contours: ContourLine[] = [];
    
    // Simple contouring algorithm for demonstration
    thresholds.forEach(threshold => {
      const contourCoordinates: number[][][] = [];
      
      // Identify cells that cross the threshold
      for (let y = 0; y < height - 1; y++) {
        for (let x = 0; x < width - 1; x++) {
          const idx = y * width + x;
          const val = data[idx];
          
          // Check if this cell has corners both above and below the threshold
          const corners = [
            val,
            data[idx + 1],            // right
            data[idx + width],        // below
            data[idx + width + 1]     // below-right
          ];
          
          const aboveThreshold = corners.some(v => v >= threshold);
          const belowThreshold = corners.some(v => v < threshold);
          
          if (aboveThreshold && belowThreshold) {
            // This cell contains part of a contour line
            // For simplicity, we'll just add the center of the cell
            // as part of the contour
            
            const ring: number[][] = [];
            
            // Transform to geographic coordinates
            const { north, south, east, west } = bounds;
            const lngStep = (east - west) / width;
            const latStep = (north - south) / height;
            
            const lng = west + (x + 0.5) * lngStep;
            const lat = north - (y + 0.5) * latStep;
            
            ring.push([lng, lat]);
            
            // In a real implementation, you would compute the actual
            // contour line intersections with the cell edges
            
            contourCoordinates.push(ring);
          }
        }
      }
      
      if (contourCoordinates.length > 0) {
        contours.push({
          elevation: threshold,
          coordinates: contourCoordinates
        });
      }
    });
    
    console.log(`Generated ${contours.length} contour lines`);
    return contours;
  }
  
  /**
   * Calculate contour line color based on elevation
   * @param elevation Elevation in meters
   * @param minElevation Minimum elevation in the data
   * @param maxElevation Maximum elevation in the data
   * @param format Either 'hex' or 'rgb'
   */
  getContourColor(
    elevation: number, 
    minElevation: number, 
    maxElevation: number, 
    format: 'hex' | 'rgb' = 'hex'
  ): string {
    // Normalize elevation to 0-1 range
    const normalizedElevation = (elevation - minElevation) / (maxElevation - minElevation);
    
    // Define color stops from low to high elevation
    const colorStops = [
      { elevation: 0.0, r: 0, g: 100, b: 0 },     // Dark green (low)
      { elevation: 0.3, r: 100, g: 200, b: 0 },   // Light green
      { elevation: 0.5, r: 200, g: 200, b: 100 }, // Tan
      { elevation: 0.7, r: 150, g: 100, b: 50 },  // Brown
      { elevation: 0.9, r: 120, g: 80, b: 0 },    // Dark brown
      { elevation: 1.0, r: 255, g: 255, b: 255 }  // White (high)
    ];
    
    // Find the color stops to interpolate between
    let lowerStop = colorStops[0];
    let upperStop = colorStops[colorStops.length - 1];
    
    for (let i = 0; i < colorStops.length - 1; i++) {
      if (normalizedElevation >= colorStops[i].elevation && 
          normalizedElevation <= colorStops[i + 1].elevation) {
        lowerStop = colorStops[i];
        upperStop = colorStops[i + 1];
        break;
      }
    }
    
    // Interpolate between the two color stops
    const t = (normalizedElevation - lowerStop.elevation) / 
              (upperStop.elevation - lowerStop.elevation);
    
    const r = Math.round(lowerStop.r + t * (upperStop.r - lowerStop.r));
    const g = Math.round(lowerStop.g + t * (upperStop.g - lowerStop.g));
    const b = Math.round(lowerStop.b + t * (upperStop.b - lowerStop.b));
    
    if (format === 'rgb') {
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Convert to hex
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
  }
}

export default new ContourService();
export type { ContourLine, ContourPoint }; 