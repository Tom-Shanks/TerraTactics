import { Bounds, ElevationDataSource } from '../types';
import * as GeoTIFF from 'geotiff';

interface ElevationData {
  data: number[];
  width: number;
  height: number;
  noDataValue: number;
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  pixelWidth: number;
  pixelHeight: number;
}

class ElevationService {
  async getElevationData(bounds: Bounds, source: ElevationDataSource = ElevationDataSource.AWS_TERRAIN): Promise<ElevationData> {
    try {
      switch (source) {
        case ElevationDataSource.USGS:
          return await this.fetchFromUSGS(bounds);
        case ElevationDataSource.OPEN_TOPOGRAPHY:
          return await this.fetchFromOpenTopography(bounds);
        case ElevationDataSource.AWS_TERRAIN:
        default:
          return await this.fetchFromAWSTerrain(bounds);
      }
    } catch (error) {
      console.error('Error fetching elevation data:', error);
      // Try fallback sources in a specific order
      try {
        if (source !== ElevationDataSource.AWS_TERRAIN) {
          console.log('Trying AWS Terrain Tiles as fallback...');
          return await this.fetchFromAWSTerrain(bounds);
        }
      } catch (e) {
        // Continue to next fallback
      }
      
      try {
        if (source !== ElevationDataSource.USGS) {
          console.log('Trying USGS as fallback...');
          return await this.fetchFromUSGS(bounds);
        }
      } catch (e) {
        // Continue to next fallback
      }
      
      // If we reach here, all attempts failed
      throw new Error('Failed to fetch elevation data from all available sources');
    }
  }

  private async fetchFromUSGS(bounds: Bounds): Promise<ElevationData> {
    // USGS 3DEP uses the National Map API
    // We'll use the elevation point query service since it's openly accessible
    // This is a simplified version that fetches sample points and would need to be expanded
    const { north, south, east, west } = bounds;
    
    // Calculate grid size (number of samples)
    const width = 100; // Default sample points in x direction
    const height = Math.round(width * ((north - south) / (east - west)));
    
    // Prepare empty elevation data
    const data: number[] = [];
    
    // Generate grid of sample points
    const xStep = (east - west) / width;
    const yStep = (north - south) / height;
    
    // For each sample point, make a request
    const requests = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const lon = west + x * xStep;
        const lat = north - y * yStep;
        
        const url = `https://epqs.nationalmap.gov/v1/json?x=${lon}&y=${lat}&units=Meters&output=json`;
        requests.push(fetch(url)
          .then(response => response.json())
          .then(result => {
            const elevation = result?.value ?? -9999;
            // We need to store this at the right position in our grid
            data[y * width + x] = elevation;
          })
          .catch(() => {
            // If point query fails, insert no data value
            data[y * width + x] = -9999;
          })
        );
      }
    }
    
    // Wait for all requests to complete
    await Promise.all(requests);
    
    return {
      data,
      width,
      height,
      noDataValue: -9999,
      xmin: west,
      ymin: south,
      xmax: east,
      ymax: north,
      pixelWidth: xStep,
      pixelHeight: yStep
    };
  }

  private async fetchFromOpenTopography(bounds: Bounds): Promise<ElevationData> {
    // OpenTopography provides a RESTful API but requires API keys for full access
    // However, they allow demo/testing use with a public key
    const { north, south, east, west } = bounds;
    
    // Use the public demo key for OpenTopography
    const demotype = 'SRTMGL1'; // Global 30m SRTM data
    const url = `https://portal.opentopography.org/API/globaldem?demtype=${demotype}&south=${south}&north=${north}&west=${west}&east=${east}&outputFormat=GTiff`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OpenTopography API request failed: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
      const image = await tiff.getImage();
      const rasters = await image.readRasters();
      const tiffData = rasters[0] as any;
      
      const width = image.getWidth();
      const height = image.getHeight();
      
      // Extract georeferencing information
      const fileDirectory = image.getFileDirectory();
      const pixelWidth = fileDirectory.ModelPixelScale[0];
      const pixelHeight = fileDirectory.ModelPixelScale[1];
      
      // Convert to our data format
      return {
        data: Array.from(tiffData),
        width,
        height,
        noDataValue: -9999, // Commonly used no-data value
        xmin: west,
        ymin: south,
        xmax: east,
        ymax: north,
        pixelWidth,
        pixelHeight
      };
    } catch (error) {
      console.error('Error fetching from OpenTopography:', error);
      throw error;
    }
  }

  private async fetchFromAWSTerrain(bounds: Bounds): Promise<ElevationData> {
    // AWS Terrain Tiles provides elevation data as raster tiles
    // We'll use their API directly with XYZ tile coordinates
    const { north, south, east, west } = bounds;
    
    // Function to convert lat/lng to tile coordinates (z=9 is a good balance of detail/size)
    const zoom = 9;
    
    // Convert lat/lng bounds to tile coordinates
    const minTileX = this.long2tile(west, zoom);
    const maxTileX = this.long2tile(east, zoom);
    const minTileY = this.lat2tile(north, zoom);
    const maxTileY = this.lat2tile(south, zoom);
    
    // Calculate the number of tiles
    const tilesX = maxTileX - minTileX + 1;
    const tilesY = maxTileY - minTileY + 1;
    
    // Avoid fetching too many tiles
    if (tilesX * tilesY > 16) {
      throw new Error('Selected area is too large. Please select a smaller region.');
    }
    
    // For each tile, fetch the data
    const tilePromises = [];
    for (let x = minTileX; x <= maxTileX; x++) {
      for (let y = minTileY; y <= maxTileY; y++) {
        tilePromises.push(this.fetchTerrainTile(x, y, zoom));
      }
    }
    
    const tiles = await Promise.all(tilePromises);
    
    // Now we need to merge the tiles into a single dataset
    // Each terrain tile is 256x256 pixels
    const tileSize = 256;
    const width = tilesX * tileSize;
    const height = tilesY * tileSize;
    const mergedData = new Array(width * height).fill(-9999);
    
    // Fill in the merged data array with the tile data
    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      const tileX = tile.x - minTileX;
      const tileY = tile.y - minTileY;
      
      for (let y = 0; y < tileSize; y++) {
        for (let x = 0; x < tileSize; x++) {
          const srcIdx = y * tileSize + x;
          const destX = tileX * tileSize + x;
          const destY = tileY * tileSize + y;
          const destIdx = destY * width + destX;
          mergedData[destIdx] = tile.data[srcIdx];
        }
      }
    }
    
    // Calculate pixel size in degrees
    const pixelWidth = (east - west) / width;
    const pixelHeight = (north - south) / height;
    
    return {
      data: mergedData,
      width,
      height,
      noDataValue: -9999,
      xmin: west,
      ymin: south,
      xmax: east,
      ymax: north,
      pixelWidth,
      pixelHeight
    };
  }
  
  private async fetchTerrainTile(x: number, y: number, z: number) {
    const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch terrain tile: ${response.statusText}`);
      }
      
      // Create a canvas to decode the PNG
      const blob = await response.blob();
      const imageBitmap = await createImageBitmap(blob);
      
      const canvas = document.createElement('canvas');
      canvas.width = imageBitmap.width;
      canvas.height = imageBitmap.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to create canvas context');
      }
      
      ctx.drawImage(imageBitmap, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Decode the elevation values from the RGB values
      // In terrarium format: height = R * 256 + G + B / 256 - 32768
      const rgbaData = imageData.data;
      const elevationData = new Array(canvas.width * canvas.height);
      
      for (let i = 0; i < elevationData.length; i++) {
        const rgba = i * 4;
        elevationData[i] = (rgbaData[rgba] * 256 + rgbaData[rgba + 1] + rgbaData[rgba + 2] / 256) - 32768;
      }
      
      return {
        data: elevationData,
        width: canvas.width,
        height: canvas.height,
        x,
        y,
        z
      };
    } catch (error) {
      console.error(`Error fetching terrain tile (${z}/${x}/${y}):`, error);
      // Return empty data for this tile
      return {
        data: new Array(256 * 256).fill(-9999),
        width: 256,
        height: 256,
        x,
        y,
        z
      };
    }
  }
  
  // Convert longitude to tile x coordinate
  private long2tile(lon: number, zoom: number): number {
    return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
  }
  
  // Convert latitude to tile y coordinate
  private lat2tile(lat: number, zoom: number): number {
    return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  }
}

export default new ElevationService();
export type { ElevationData }; 