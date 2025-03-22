/**
 * Geographic bounds for a map area
 */
export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Type of grid to generate
 */
export enum GridType {
  SQUARE = 'square',
  HEX = 'hex'
}

/**
 * Game system presets for grid sizes
 */
export enum GameSystem {
  GENERIC = 'generic',
  DND_5E = 'dnd5e',
  WARHAMMER_40K = '40k',
  BATTLETECH = 'battletech'
}

/**
 * Export formats
 */
export enum ExportFormat {
  PNG = 'png',
  PDF = 'pdf'
}

/**
 * Paper size options for export
 */
export enum PaperSize {
  A4 = 'a4',
  LETTER = 'letter',
  LEGAL = 'legal',
  TABLOID = 'tabloid'
}

/**
 * Paper orientation options
 */
export enum PaperOrientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape'
}

/**
 * Options for exporting maps
 */
export interface ExportOptions {
  format: ExportFormat;
  filename: string;
  paperSize: PaperSize;
  orientation: PaperOrientation;
  dpi: number;
  includeMetadata: boolean;
}

/**
 * Options for rendering maps
 */
export interface RenderOptions {
  showContours?: boolean;
  showGrid?: boolean;
  showScale?: boolean;
  showTitle?: boolean;
  title?: string;
  contourColor?: string;
  gridColor?: string;
  backgroundColor?: string;
}

/**
 * Game system configuration
 */
export interface GameSystemConfig {
  name: string;
  gridType: GridType;
  gridSize: number; // Grid size in real-world units
  unit: 'feet' | 'meters' | 'inches';
  scaleRatio: number; // Real-world units per grid square/hex
}

/**
 * Default game system configurations
 */
export const GAME_SYSTEM_PRESETS: Record<GameSystem, GameSystemConfig> = {
  [GameSystem.DND_5E]: {
    name: 'D&D 5th Edition',
    gridType: GridType.SQUARE,
    gridSize: 5,
    unit: 'feet',
    scaleRatio: 1
  },
  [GameSystem.WARHAMMER_40K]: {
    name: 'Warhammer 40K',
    gridType: GridType.SQUARE,
    gridSize: 1,
    unit: 'inches',
    scaleRatio: 1
  },
  [GameSystem.BATTLETECH]: {
    name: 'Battletech',
    gridType: GridType.HEX,
    gridSize: 30,
    unit: 'meters',
    scaleRatio: 1
  },
  [GameSystem.GENERIC]: {
    name: 'Generic',
    gridType: GridType.SQUARE,
    gridSize: 10,
    unit: 'feet',
    scaleRatio: 1
  }
};

// Elevation data source
export enum ElevationDataSource {
  USGS = 'usgs',
  OPEN_TOPOGRAPHY = 'openTopography',
  AWS_TERRAIN = 'awsTerrain',
}

// Contour interval options
export interface ContourInterval {
  id: string;
  name: string;
  value: number; // in meters
}

export const CONTOUR_INTERVALS: ContourInterval[] = [
  { id: 'fine', name: 'Fine (5m)', value: 5 },
  { id: 'medium', name: 'Medium (10m)', value: 10 },
  { id: 'coarse', name: 'Coarse (25m)', value: 25 },
  { id: 'verCoarse', name: 'Very Coarse (50m)', value: 50 },
]; 