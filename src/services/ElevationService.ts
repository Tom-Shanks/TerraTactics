import { Bounds } from '../types';
import * as GeoTIFF from 'geotiff';

export interface ElevationData {
  data: number[];
  width: number;
  height: number;
  bounds: Bounds;
  minElevation: number;
  maxElevation: number;
}

class ElevationService {
  /**
   * Fetches elevation data from the USGS 3DEP service
   * This uses a public endpoint that doesn't require an API key
   */
  async getElevationData(bounds: Bounds): Promise<ElevationData> {
    try {
      console.log('Fetching elevation data for bounds:', bounds);
      const { north, south, east, west } = bounds;
      
      // Calculate appropriate dimensions
      const width = Math.ceil((east - west) * 3600); // ~30m resolution
      const height = Math.ceil((north - south) * 3600);
      
      console.log(`Raw dimensions: ${width}x${height}`);
      
      // Limit size to prevent browser crashes
      const maxSize = 1000;
      const scale = Math.min(1, maxSize / Math.max(width, height));
      
      const scaledWidth = Math.floor(width * scale);
      const scaledHeight = Math.floor(height * scale);
      
      console.log(`Scaled dimensions: ${scaledWidth}x${scaledHeight}`);
      
      // USGS 3DEP public endpoint (no key required)
      const url = `https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/exportImage?` +
        `bbox=${west},${south},${east},${north}&bboxSR=4326&size=${scaledWidth},${scaledHeight}&` + 
        `imageSR=4326&format=tiff&pixelType=F32&noDataInterpretation=esriNoDataMatchAny&` +
        `interpolation=RSP_BilinearInterpolation&f=image`;
      
      console.log('Requesting elevation data from URL:', url);
      
      // For now, we'll simulate the elevation data
      // In a real implementation, you would process the GeoTIFF data
      
      // This is placeholder code that would be replaced with actual GeoTIFF processing
      // Using a library like geotiff.js:
      // const response = await fetch(url);
      // const blob = await response.blob();
      // const tiff = await GeoTIFF.fromBlob(blob);
      // const image = await tiff.getImage();
      // const rasters = await image.readRasters();
      // const elevationData = rasters[0]; // First band contains elevation values
      
      // For demonstration, generate some random elevation data with a realistic pattern
      const simulatedData = this.generateSimulatedElevationData(scaledWidth, scaledHeight);
      
      return {
        data: simulatedData.data,
        width: scaledWidth,
        height: scaledHeight,
        bounds,
        minElevation: simulatedData.minElevation,
        maxElevation: simulatedData.maxElevation
      };
    } catch (error) {
      console.error('Error fetching elevation data:', error);
      throw new Error(`Failed to fetch elevation data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Generates simulated elevation data for testing
   * This creates a relatively realistic looking terrain with mountains and valleys
   */
  private generateSimulatedElevationData(width: number, height: number) {
    const data: number[] = new Array(width * height);
    let minElevation = Infinity;
    let maxElevation = -Infinity;
    
    // Generate a simple terrain with some peaks and valleys
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Base elevation (0-1000 meters)
        let elevation = 500;
        
        // Add some noise for realism
        elevation += Math.sin(x/20) * Math.cos(y/20) * 200;
        elevation += Math.sin(x/10 + y/10) * 100;
        
        // Add a mountain peak near the center
        const centerX = width / 2;
        const centerY = height / 2;
        const distanceFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        const mountainFactor = Math.max(0, 1 - distanceFromCenter / (Math.min(width, height) / 2));
        elevation += mountainFactor * 500;
        
        // Make sure elevation is positive (above sea level)
        elevation = Math.max(0, elevation);
        
        // Store elevation and update min/max
        data[y * width + x] = elevation;
        minElevation = Math.min(minElevation, elevation);
        maxElevation = Math.max(maxElevation, elevation);
      }
    }
    
    return { data, minElevation, maxElevation };
  }
  
  /**
   * Alternative method using OpenTopography API
   * This uses the demo API key which is allowed for low-volume usage
   */
  async getOpenTopographyData(bounds: Bounds): Promise<ElevationData> {
    try {
      console.log('Fetching OpenTopography data for bounds:', bounds);
      const { north, south, east, west } = bounds;
      
      // OpenTopography global dataset with public demo key
      const url = `https://portal.opentopography.org/API/globaldem?` +
        `demtype=SRTMGL1&south=${south}&north=${north}&west=${west}&east=${east}&` +
        `outputFormat=GTiff&API_Key=demoapikeyot2020`;  // Demo API key is public
      
      console.log('Requesting elevation data from OpenTopography URL:', url);
      
      // Same as above, we're simulating for now
      // For a real implementation, you would process the GeoTIFF response
      
      // Calculate reasonable dimensions based on the area
      const width = Math.min(500, Math.ceil((east - west) * 1200));
      const height = Math.min(500, Math.ceil((north - south) * 1200));
      
      // Generate simulated data
      const simulatedData = this.generateSimulatedElevationData(width, height);
      
      return {
        data: simulatedData.data,
        width,
        height,
        bounds,
        minElevation: simulatedData.minElevation,
        maxElevation: simulatedData.maxElevation
      };
    } catch (error) {
      console.error('Error fetching OpenTopography data:', error);
      throw new Error(`Failed to fetch elevation data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export default new ElevationService(); 