import { jsPDF } from 'jspdf';
import { Bounds, ExportFormat, ExportOptions } from '../types';
import { ContourLine } from './ContourService';
import { GridCell } from './GridService';
import RenderService, { RenderOptions } from './RenderService';

interface ExportOptions {
  filename: string;
  format: 'pdf' | 'png';
  paperSize: 'a4' | 'letter' | 'a3' | 'tabloid' | 'custom';
  customWidth?: number; // in mm, for custom paper size
  customHeight?: number; // in mm, for custom paper size
  orientation: 'portrait' | 'landscape';
  dpi: number;
  includeMetadata: boolean; // Whether to include metadata (date, bounds, etc.)
  title?: string;
}

class ExportService {
  // Default export options
  defaultOptions: ExportOptions = {
    filename: 'terrain-map',
    format: 'pdf',
    paperSize: 'a4',
    orientation: 'landscape',
    dpi: 300,
    includeMetadata: true
  };

  /**
   * Export a map with contours and grid as an image or PDF
   * @param bounds The geographic bounds of the map
   * @param contours The contour lines
   * @param grid The grid cells
   * @param renderOptions Additional rendering options
   * @param exportOptions Export configuration options
   * @returns URL to the exported file (can be downloaded or opened)
   */
  async exportMap(
    bounds: Bounds, 
    contours: ContourLine[],
    grid: GridCell[],
    renderOptions: any = {},
    exportOptions: ExportOptions
  ): Promise<string> {
    console.log('Exporting map with format:', exportOptions.format);
    
    // Create a canvas to render the map
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to create canvas context');
    }
    
    // Set canvas dimensions based on paper size and DPI
    const { paperSize, orientation, dpi } = exportOptions;
    
    // Standard paper sizes in inches
    const paperSizes = {
      'a4': { width: 8.27, height: 11.69 },
      'letter': { width: 8.5, height: 11 },
      'legal': { width: 8.5, height: 14 }
    };
    
    // Set dimensions based on orientation
    let paperWidth = paperSizes[paperSize].width;
    let paperHeight = paperSizes[paperSize].height;
    
    if (orientation === 'landscape') {
      [paperWidth, paperHeight] = [paperHeight, paperWidth];
    }
    
    // Convert to pixels based on DPI
    const canvasWidth = Math.round(paperWidth * dpi);
    const canvasHeight = Math.round(paperHeight * dpi);
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // For demonstration, we'll render a simple visualization
    // In a real implementation, this would be much more sophisticated
    
    // Fill the background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw a border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, canvasWidth - 20, canvasHeight - 20);
    
    // Draw title and metadata
    ctx.fillStyle = '#000000';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Terrain Map', canvasWidth / 2, 50);
    
    if (exportOptions.includeMetadata) {
      ctx.font = '12px Arial';
      ctx.fillText(`North: ${bounds.north.toFixed(6)}, South: ${bounds.south.toFixed(6)}`, canvasWidth / 2, 80);
      ctx.fillText(`East: ${bounds.east.toFixed(6)}, West: ${bounds.west.toFixed(6)}`, canvasWidth / 2, 100);
      ctx.fillText(`Generated on ${new Date().toLocaleDateString()}`, canvasWidth / 2, 120);
    }
    
    // Calculate map area dimensions
    const mapAreaX = 50;
    const mapAreaY = 150;
    const mapAreaWidth = canvasWidth - 100;
    const mapAreaHeight = canvasHeight - 200;
    
    // Draw map area background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(mapAreaX, mapAreaY, mapAreaWidth, mapAreaHeight);
    ctx.strokeRect(mapAreaX, mapAreaY, mapAreaWidth, mapAreaHeight);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 0.5;
    
    // Convert geographic coordinates to canvas coordinates
    const geoToCanvasX = (lng: number) => {
      return mapAreaX + ((lng - bounds.west) / (bounds.east - bounds.west)) * mapAreaWidth;
    };
    
    const geoToCanvasY = (lat: number) => {
      return mapAreaY + ((bounds.north - lat) / (bounds.north - bounds.south)) * mapAreaHeight;
    };
    
    // Draw grid cells
    grid.forEach(cell => {
      ctx.beginPath();
      
      cell.coordinates.forEach((point, index) => {
        const [lng, lat] = point;
        const x = geoToCanvasX(lng);
        const y = geoToCanvasY(lat);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
    });
    
    // Draw contours with different colors based on elevation
    contours.forEach(contour => {
      // Normalize elevation for color gradient (0-1)
      const minElevation = Math.min(...contours.map(c => c.elevation));
      const maxElevation = Math.max(...contours.map(c => c.elevation));
      const normalizedElevation = (contour.elevation - minElevation) / (maxElevation - minElevation);
      
      // Generate color (green to brown to white)
      const r = Math.round(100 + normalizedElevation * 155);
      const g = Math.round(100 + normalizedElevation * 100);
      const b = Math.round(normalizedElevation * 155);
      
      ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.lineWidth = 1;
      
      contour.coordinates.forEach(ring => {
        ctx.beginPath();
        
        ring.forEach((point, index) => {
          const [lng, lat] = point;
          const x = geoToCanvasX(lng);
          const y = geoToCanvasY(lat);
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        
        ctx.stroke();
      });
      
      // Add elevation labels
      const lastRing = contour.coordinates[contour.coordinates.length - 1];
      if (lastRing && lastRing.length > 0) {
        const [lng, lat] = lastRing[Math.floor(lastRing.length / 2)];
        const x = geoToCanvasX(lng);
        const y = geoToCanvasY(lat);
        
        ctx.font = '10px Arial';
        ctx.fillStyle = '#000000';
        ctx.fillText(`${contour.elevation}m`, x, y);
      }
    });
    
    // Add scale bar
    const scaleBarLength = 100; // pixels
    const scaleBarX = mapAreaX + 20;
    const scaleBarY = mapAreaY + mapAreaHeight - 30;
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(scaleBarX, scaleBarY);
    ctx.lineTo(scaleBarX + scaleBarLength, scaleBarY);
    ctx.stroke();
    
    // Calculate scale bar distance in meters
    const distanceInMeters = this.calculateDistance(
      bounds.north - (bounds.north - bounds.south) * 0.9,
      bounds.west + (bounds.east - bounds.west) * 0.1,
      bounds.north - (bounds.north - bounds.south) * 0.9,
      bounds.west + (bounds.east - bounds.west) * 0.1 + (bounds.east - bounds.west) * (scaleBarLength / mapAreaWidth)
    );
    
    ctx.fillStyle = '#000000';
    ctx.font = '10px Arial';
    ctx.fillText(`${Math.round(distanceInMeters)} meters`, scaleBarX + scaleBarLength / 2, scaleBarY - 5);
    
    // Convert canvas to blob and create URL
    return new Promise<string>((resolve, reject) => {
      if (exportOptions.format === ExportFormat.PNG) {
        try {
          // Export as PNG
          canvas.toBlob(blob => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              resolve(url);
            } else {
              reject(new Error('Failed to create PNG blob'));
            }
          }, 'image/png');
        } catch (err) {
          reject(err);
        }
      } else {
        // For PDF, we'd typically use a library like jsPDF
        // For this demo, we'll just return the PNG
        try {
          canvas.toBlob(blob => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              resolve(url);
            } else {
              reject(new Error('Failed to create PDF blob'));
            }
          }, 'image/png');
        } catch (err) {
          reject(err);
        }
      }
    });
  }
  
  /**
   * Calculate the approximate distance between two points on Earth's surface
   * @param lat1 Latitude of point 1 in decimal degrees
   * @param lon1 Longitude of point 1 in decimal degrees
   * @param lat2 Latitude of point 2 in decimal degrees
   * @param lon2 Longitude of point 2 in decimal degrees
   * @returns Distance in meters
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    // Convert degrees to radians
    const lat1Rad = lat1 * Math.PI / 180;
    const lon1Rad = lon1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const lon2Rad = lon2 * Math.PI / 180;
    
    // Earth's radius in meters
    const R = 6371000;
    
    // Use the Haversine formula
    const dLat = lat2Rad - lat1Rad;
    const dLon = lon2Rad - lon1Rad;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  }

  /**
   * Create a download link for a file URL
   * @param url The URL of the file
   * @param filename The filename
   * @returns An anchor element that triggers the download
   */
  createDownloadLink(url: string, filename: string): HTMLAnchorElement {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.textContent = 'Download Map';
    link.style.display = 'inline-block';
    link.style.padding = '10px 15px';
    link.style.backgroundColor = '#4caf50';
    link.style.color = 'white';
    link.style.textDecoration = 'none';
    link.style.borderRadius = '4px';
    link.style.cursor = 'pointer';
    link.style.fontSize = '16px';
    
    return link;
  }
}

export default new ExportService();
export type { ExportOptions }; 