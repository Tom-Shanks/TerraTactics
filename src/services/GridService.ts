import { Bounds, GridType, GameSystem } from '../types';

export interface GridCell {
  id: string;
  coordinates: number[][]; // Array of [lng, lat] points forming the cell
  center: [number, number]; // [lng, lat] of center point
}

interface GridConfig {
  type: GridType;
  gridSize: number; // in mm
  scaleRatio: number; // Real-world distance per grid unit
  showLabels: boolean;
  labelCharset: 'numbers' | 'alphanumeric';
}

class GridService {
  /**
   * Generate a grid overlay for tabletop gaming
   * @param bounds Geographic bounds of the area
   * @param gridType Type of grid (square or hex)
   * @param gridSize Size of each grid cell in game units (e.g., 5 feet)
   * @returns Array of grid cells
   */
  generateGrid(bounds: Bounds, gridType: GridType, gridSize: number): GridCell[] {
    console.log(`Generating ${gridType} grid with size ${gridSize} units`);
    
    const { north, south, east, west } = bounds;
    
    // Calculate the real-world distance of the area
    const widthMeters = this.calculateDistance(north, west, north, east);
    const heightMeters = this.calculateDistance(north, west, south, west);
    
    console.log(`Area dimensions: ${widthMeters.toFixed(2)}m x ${heightMeters.toFixed(2)}m`);
    
    // Calculate cell size in meters (1 unit = 1 foot for D&D)
    const feetToMeters = 0.3048;
    const cellSizeMeters = gridSize * feetToMeters;
    
    // Calculate number of cells in each dimension
    const cellsX = Math.ceil(widthMeters / cellSizeMeters);
    const cellsY = Math.ceil(heightMeters / cellSizeMeters);
    
    console.log(`Grid dimensions: ${cellsX} x ${cellsY} cells`);
    
    // Generate grid based on type
    if (gridType === GridType.HEX) {
      return this.generateHexGrid(bounds, cellsX, cellsY, cellSizeMeters);
    } else {
      return this.generateSquareGrid(bounds, cellsX, cellsY, cellSizeMeters);
    }
  }
  
  /**
   * Generate a square grid
   * @param bounds Geographic bounds
   * @param cellsX Number of cells in X direction
   * @param cellsY Number of cells in Y direction
   * @param cellSizeMeters Size of each cell in meters
   * @returns Array of grid cells
   */
  private generateSquareGrid(
    bounds: Bounds,
    cellsX: number,
    cellsY: number,
    cellSizeMeters: number
  ): GridCell[] {
    const { north, south, east, west } = bounds;
    const grid: GridCell[] = [];
    
    // Calculate the degrees per meter in longitude and latitude
    const latMeters = this.calculateDistance(north, west, south, west);
    const lngMeters = this.calculateDistance(north, west, north, east);
    
    const latDegreePerMeter = (north - south) / latMeters;
    const lngDegreePerMeter = (east - west) / lngMeters;
    
    const cellSizeLat = cellSizeMeters * latDegreePerMeter;
    const cellSizeLng = cellSizeMeters * lngDegreePerMeter;
    
    // Generate each cell
    for (let y = 0; y < cellsY; y++) {
      for (let x = 0; x < cellsX; x++) {
        const cellWest = west + x * cellSizeLng;
        const cellEast = west + (x + 1) * cellSizeLng;
        const cellNorth = north - y * cellSizeLat;
        const cellSouth = north - (y + 1) * cellSizeLat;
        
        // Cell coordinates in clockwise order
        const coordinates = [
          [cellWest, cellNorth],  // top-left
          [cellEast, cellNorth],  // top-right
          [cellEast, cellSouth],  // bottom-right
          [cellWest, cellSouth],  // bottom-left
          [cellWest, cellNorth]   // back to start to close the polygon
        ];
        
        // Calculate center point
        const centerLng = (cellWest + cellEast) / 2;
        const centerLat = (cellNorth + cellSouth) / 2;
        
        grid.push({
          id: `square-${x}-${y}`,
          coordinates,
          center: [centerLng, centerLat]
        });
      }
    }
    
    return grid;
  }
  
  /**
   * Generate a hexagonal grid
   * @param bounds Geographic bounds
   * @param cellsX Number of cells in X direction
   * @param cellsY Number of cells in Y direction
   * @param cellSizeMeters Size of each cell in meters (measured flat to flat)
   * @returns Array of grid cells
   */
  private generateHexGrid(
    bounds: Bounds,
    cellsX: number,
    cellsY: number,
    cellSizeMeters: number
  ): GridCell[] {
    const { north, south, east, west } = bounds;
    const grid: GridCell[] = [];
    
    // Calculate the degrees per meter in longitude and latitude
    const latMeters = this.calculateDistance(north, west, south, west);
    const lngMeters = this.calculateDistance(north, west, north, east);
    
    const latDegreePerMeter = (north - south) / latMeters;
    const lngDegreePerMeter = (east - west) / lngMeters;
    
    // For hexagons, we need to calculate some special dimensions
    // Horizontal distance between hex centers is 1.5 * radius
    // Vertical distance between hex centers is sqrt(3) * radius
    
    const hexRadius = cellSizeMeters / 2;
    const hexWidth = hexRadius * 2;
    const hexHeight = hexRadius * Math.sqrt(3);
    
    const hexWidthLng = hexWidth * lngDegreePerMeter;
    const hexHeightLat = hexHeight * latDegreePerMeter;
    
    // Horizontal spacing between hex centers
    const hexHorizSpacing = hexRadius * 1.5 * lngDegreePerMeter;
    
    // Generate hex grid
    for (let row = 0; row < cellsY; row++) {
      const isOddRow = row % 2 === 1;
      const rowOffset = isOddRow ? hexHorizSpacing / 2 : 0;
      
      for (let col = 0; col < cellsX; col++) {
        const centerLng = west + rowOffset + col * hexHorizSpacing;
        const centerLat = north - (row * hexHeightLat);
        
        // Generate the six points of the hexagon
        const coordinates: number[][] = [];
        
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const x = centerLng + (hexRadius * lngDegreePerMeter * Math.cos(angle));
          const y = centerLat - (hexRadius * latDegreePerMeter * Math.sin(angle));
          coordinates.push([x, y]);
        }
        
        // Close the polygon
        coordinates.push(coordinates[0]);
        
        grid.push({
          id: `hex-${col}-${row}`,
          coordinates,
          center: [centerLng, centerLat]
        });
      }
    }
    
    return grid;
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
   * Get an appropriate color for a grid cell based on its position
   * @param id The cell ID
   * @returns A CSS color string
   */
  getGridCellColor(id: string): string {
    // For now, return a semi-transparent black
    return 'rgba(0, 0, 0, 0.5)';
  }

  /**
   * Create a grid config from a game system
   * @param gameSystem The game system
   * @param showLabels Whether to show grid labels
   * @returns Grid configuration
   */
  createGridConfig(gameSystem: GameSystem, showLabels: boolean = true): GridConfig {
    return {
      type: gameSystem.defaultGridType,
      gridSize: gameSystem.gridSize,
      scaleRatio: gameSystem.scaleRatio,
      showLabels,
      labelCharset: 'alphanumeric'
    };
  }
}

export default new GridService();
export type { GridCell, GridConfig }; 