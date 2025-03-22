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
 * Grid types for tabletop gaming
 */
export enum GridType {
  SQUARE = 'square',
  HEX = 'hex'
}

/**
 * Game system presets for common tabletop games
 */
export enum GameSystem {
  DND_5E = 'dnd5e',
  WARHAMMER_40K = 'warhammer40k',
  BATTLETECH = 'battletech',
  CUSTOM = 'custom'
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
 * Export format options
 */
export enum ExportFormat {
  PNG = 'png',
  PDF = 'pdf'
}

/**
 * Export options configuration
 */
export interface ExportOptions {
  format: ExportFormat;
  filename: string;
  paperSize: 'a4' | 'letter' | 'legal';
  orientation: 'portrait' | 'landscape';
  dpi: number;
  includeMetadata: boolean;
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
  [GameSystem.CUSTOM]: {
    name: 'Custom',
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