import { Bounds, GridType, GameSystem } from '../types';

interface GridCell {
  id: string;
  points: { x: number; y: number }[];
  center: { x: number; y: number };
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
   * Generate a grid for the specified bounds and configuration
   * @param bounds The geographic bounds for the grid
   * @param config The grid configuration
   * @returns Array of grid cells
   */
  generateGrid(bounds: Bounds, config: GridConfig): GridCell[] {
    return config.type === GridType.HEX
      ? this.generateHexGrid(bounds, config)
      : this.generateSquareGrid(bounds, config);
  }

  /**
   * Generates a square grid for the specified bounds and configuration
   * @param bounds The geographic bounds for the grid
   * @param config The grid configuration
   * @returns Array of grid cells
   */
  private generateSquareGrid(bounds: Bounds, config: GridConfig): GridCell[] {
    const { north, south, east, west } = bounds;
    const { gridSize, scaleRatio } = config;
    
    // Calculate the cell size in degrees
    // This is an approximation since 1 degree of latitude/longitude varies by location
    // For a more accurate conversion, we'd use a proper projection library
    
    // At the equator, 1 degree of longitude is approximately 111 km
    // Adjust based on latitude - at lat degrees, 1 degree of longitude = 111 * cos(lat) km
    const avgLat = (north + south) / 2;
    const cosLat = Math.cos(avgLat * Math.PI / 180);
    
    // Convert grid size from mm to km
    const gridSizeKm = (gridSize / 1000) * scaleRatio;
    
    // Calculate cell size in degrees
    // 111 km = 1 degree at the equator
    const cellSizeLat = gridSizeKm / 111;
    const cellSizeLng = gridSizeKm / (111 * cosLat);
    
    // Calculate the number of cells
    const numLat = Math.ceil((north - south) / cellSizeLat);
    const numLng = Math.ceil((east - west) / cellSizeLng);
    
    // Generate cells
    const cells: GridCell[] = [];
    
    for (let i = 0; i < numLat; i++) {
      for (let j = 0; j < numLng; j++) {
        const cellId = this.generateCellId(j, i, config);
        const cellSouth = north - (i + 1) * cellSizeLat;
        const cellNorth = north - i * cellSizeLat;
        const cellWest = west + j * cellSizeLng;
        const cellEast = west + (j + 1) * cellSizeLng;
        
        const cell: GridCell = {
          id: cellId,
          points: [
            { x: cellWest, y: cellNorth },
            { x: cellEast, y: cellNorth },
            { x: cellEast, y: cellSouth },
            { x: cellWest, y: cellSouth },
            { x: cellWest, y: cellNorth } // Close the polygon
          ],
          center: {
            x: (cellWest + cellEast) / 2,
            y: (cellNorth + cellSouth) / 2
          }
        };
        
        cells.push(cell);
      }
    }
    
    return cells;
  }

  /**
   * Generates a hexagonal grid for the specified bounds and configuration
   * @param bounds The geographic bounds for the grid
   * @param config The grid configuration
   * @returns Array of grid cells
   */
  private generateHexGrid(bounds: Bounds, config: GridConfig): GridCell[] {
    const { north, south, east, west } = bounds;
    const { gridSize, scaleRatio } = config;
    
    // Calculate the cell size in degrees (similar to square grid)
    const avgLat = (north + south) / 2;
    const cosLat = Math.cos(avgLat * Math.PI / 180);
    
    // Convert grid size from mm to km
    const gridSizeKm = (gridSize / 1000) * scaleRatio;
    
    // For a hexagon, the width (flat-to-flat) is 2 * inradius
    // The height (point-to-point) is 2 * circumradius
    // For a regular hexagon, circumradius = inradius / cos(30°) = inradius * 2/sqrt(3)
    const inradius = gridSizeKm / 2;
    const circumradius = inradius * 2 / Math.sqrt(3);
    
    // Calculate hex dimensions in degrees
    const hexWidthLng = (inradius * 2) / (111 * cosLat);
    const hexHeightLat = (circumradius * 2) / 111;
    
    // Calculate the number of hexes in each direction
    // For a hex grid, rows are offset from each other
    const numLat = Math.ceil((north - south) / (hexHeightLat * 0.75)) + 1; // Add 1 to ensure we cover the area
    const numLng = Math.ceil((east - west) / hexWidthLng) + 1; // Add 1 to ensure we cover the area
    
    // Generate hex cells
    const cells: GridCell[] = [];
    
    for (let i = 0; i < numLat; i++) {
      for (let j = 0; j < numLng; j++) {
        // Odd rows are offset by half a hex width
        const isOddRow = i % 2 === 1;
        const offset = isOddRow ? hexWidthLng / 2 : 0;
        
        const cellId = this.generateCellId(j, i, config);
        const centerY = north - i * (hexHeightLat * 0.75) - circumradius / 111;
        const centerX = west + j * hexWidthLng + offset + inradius / (111 * cosLat);
        
        // Skip if the center is outside our bounds
        if (centerX > east || centerY < south) {
          continue;
        }
        
        // Generate the 6 points of the hexagon
        const points = [];
        for (let k = 0; k < 6; k++) {
          const angle = Math.PI / 3 * k;
          const x = centerX + (inradius * Math.cos(angle)) / (111 * cosLat);
          const y = centerY + (circumradius * Math.sin(angle)) / 111;
          points.push({ x, y });
        }
        // Close the polygon
        points.push({ ...points[0] });
        
        const cell: GridCell = {
          id: cellId,
          points,
          center: {
            x: centerX,
            y: centerY
          }
        };
        
        cells.push(cell);
      }
    }
    
    return cells;
  }

  /**
   * Generate a cell ID based on its position
   * @param x Column index
   * @param y Row index
   * @param config Grid configuration
   * @returns Cell ID (e.g., "A1", "B2")
   */
  private generateCellId(x: number, y: number, config: GridConfig): string {
    if (!config.showLabels) {
      return '';
    }
    
    if (config.labelCharset === 'alphanumeric') {
      // Convert column index to letter (A, B, C, ..., Z, AA, AB, ...)
      let colStr = '';
      let tempX = x;
      
      do {
        const remainder = tempX % 26;
        colStr = String.fromCharCode(65 + remainder) + colStr;
        tempX = Math.floor(tempX / 26) - 1;
      } while (tempX >= 0);
      
      // Row index is 1-based
      return `${colStr}${y + 1}`;
    } else {
      // Use numbers for both dimensions
      return `${x + 1},${y + 1}`;
    }
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