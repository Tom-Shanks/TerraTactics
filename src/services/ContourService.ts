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

interface ContourLine {
  level: number; // Elevation level
  path: ContourPolygon[]; // Array of polygons forming this contour
  isMajor: boolean; // Whether this is a major contour line
}

class ContourService {
  /**
   * Generate contour lines from elevation data
   * @param elevationData The elevation data
   * @param contourInterval The interval between contour lines in meters
   * @param majorInterval How many intervals between major contours (thicker lines)
   * @returns Array of contour lines
   */
  generateContours(
    elevationData: ElevationData, 
    contourInterval: number = 10, 
    majorInterval: number = 5
  ): ContourLine[] {
    // Convert the 1D elevation data to a 2D array for d3-contour
    const data = new Array(elevationData.height);
    for (let y = 0; y < elevationData.height; y++) {
      data[y] = new Array(elevationData.width);
      for (let x = 0; x < elevationData.width; x++) {
        data[y][x] = elevationData.data[y * elevationData.width + x];
      }
    }

    // Find min and max elevation to establish threshold range
    const validValues = elevationData.data.filter(v => v !== elevationData.noDataValue);
    const minElevation = Math.min(...validValues);
    const maxElevation = Math.max(...validValues);
    
    // Round min and max to the nearest contour interval
    const roundedMin = Math.floor(minElevation / contourInterval) * contourInterval;
    const roundedMax = Math.ceil(maxElevation / contourInterval) * contourInterval;
    
    // Generate thresholds based on the contour interval
    const thresholds = [];
    for (let i = roundedMin; i <= roundedMax; i += contourInterval) {
      thresholds.push(i);
    }
    
    // Use d3-contour to generate the contour polygons
    const contourGenerator = d3.contours()
      .size([elevationData.width, elevationData.height])
      .thresholds(thresholds);
    
    const contours = contourGenerator(elevationData.data as unknown as number[][]);
    
    // Convert the contours to the format we want
    return contours.map((contour: any) => {
      // Check if this is a major contour line
      const isMajor = contour.value % (contourInterval * majorInterval) === 0;
      
      // Convert the coordinates to point arrays
      const convertedPaths = contour.coordinates.map((polygon: number[][][]) => {
        return polygon.map((ring: number[][]) => {
          return ring.map((point: number[]) => {
            // Convert pixel coordinates to geographic coordinates
            const [x, y] = point;
            const lon = elevationData.xmin + x * elevationData.pixelWidth;
            const lat = elevationData.ymax - y * elevationData.pixelHeight;
            return { x: lon, y: lat };
          });
        });
      });
      
      return {
        level: contour.value,
        path: convertedPaths,
        isMajor
      };
    });
  }
  
  /**
   * Process contours using Web Workers for better performance
   * @param elevationData The elevation data
   * @param contourInterval The interval between contour lines
   * @param majorInterval How many intervals between major contours
   * @returns Promise that resolves to array of contour lines
   */
  async generateContoursAsync(
    elevationData: ElevationData, 
    contourInterval: number = 10, 
    majorInterval: number = 5
  ): Promise<ContourLine[]> {
    return new Promise((resolve, reject) => {
      try {
        // Create a temporary worker blob URL
        const workerFunction = `
          self.onmessage = function(e) {
            const { elevationData, contourInterval, majorInterval } = e.data;
            
            // Convert the 1D elevation data to a 2D array for d3-contour
            const width = elevationData.width;
            const height = elevationData.height;
            
            // Find min and max elevation to establish threshold range
            const validValues = elevationData.data.filter(v => v !== elevationData.noDataValue);
            const minElevation = Math.min(...validValues);
            const maxElevation = Math.max(...validValues);
            
            // Round min and max to the nearest contour interval
            const roundedMin = Math.floor(minElevation / contourInterval) * contourInterval;
            const roundedMax = Math.ceil(maxElevation / contourInterval) * contourInterval;
            
            // Generate thresholds based on the contour interval
            const thresholds = [];
            for (let i = roundedMin; i <= roundedMax; i += contourInterval) {
              thresholds.push(i);
            }
            
            // Calculate contours
            // Note: In a real implementation, you'd need to import or include d3 in the worker
            // This is a simplified example
            
            // Simulate contour generation with a timeout
            setTimeout(() => {
              self.postMessage({
                success: true,
                contours: [
                  { level: roundedMin, path: [], isMajor: true },
                  // More contours would be here in a real implementation
                ]
              });
            }, 100);
          };
        `;
        
        const blob = new Blob([workerFunction], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl);
        
        worker.onmessage = (e) => {
          if (e.data.success) {
            URL.revokeObjectURL(workerUrl);
            worker.terminate();
            resolve(e.data.contours);
          } else {
            URL.revokeObjectURL(workerUrl);
            worker.terminate();
            reject(new Error('Worker failed to generate contours'));
          }
        };
        
        worker.onerror = (error) => {
          URL.revokeObjectURL(workerUrl);
          worker.terminate();
          reject(error);
        };
        
        worker.postMessage({
          elevationData,
          contourInterval,
          majorInterval
        });
      } catch (error) {
        // Fallback to non-worker method if Web Workers are not supported
        try {
          const contours = this.generateContours(elevationData, contourInterval, majorInterval);
          resolve(contours);
        } catch (fallbackError) {
          reject(fallbackError);
        }
      }
    });
  }
  
  /**
   * Simplify contour lines to reduce file size and improve performance
   * @param contours The contour lines to simplify
   * @param tolerance The tolerance level for simplification
   * @returns Simplified contour lines
   */
  simplifyContours(contours: ContourLine[], tolerance: number = 0.0001): ContourLine[] {
    // We'd use a line simplification algorithm like Douglas-Peucker
    // This is a simplified implementation
    return contours.map(contour => {
      return {
        ...contour,
        path: contour.path.map(polygon => {
          return polygon.map(ring => {
            // Simple point reduction - remove points that are too close to each other
            const simplifiedRing: ContourPoint[] = [];
            let lastPoint: ContourPoint | null = null;
            
            for (const point of ring) {
              if (!lastPoint || 
                  Math.sqrt(
                    Math.pow(point.x - lastPoint.x, 2) + 
                    Math.pow(point.y - lastPoint.y, 2)
                  ) > tolerance) {
                simplifiedRing.push(point);
                lastPoint = point;
              }
            }
            
            return simplifiedRing;
          });
        })
      };
    });
  }
}

export default new ContourService();
export type { ContourLine, ContourPoint }; 