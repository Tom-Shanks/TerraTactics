// Geographic bounds interface
export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Grid type enumeration
export enum GridType {
  HEX = 'hex',
  SQUARE = 'square'
}

// Game system preset interface
export interface GameSystem {
  id: string;
  name: string;
  defaultGridType: GridType;
  gridSize: number; // in mm
  scaleRatio: number; // e.g., 1:100
}

// Common game systems
export const GAME_SYSTEMS: GameSystem[] = [
  {
    id: 'dnd',
    name: 'Dungeons & Dragons',
    defaultGridType: GridType.SQUARE,
    gridSize: 25.4, // 1 inch in mm
    scaleRatio: 5, // 1 square = 5 feet
  },
  {
    id: 'warhammer',
    name: 'Warhammer 40K',
    defaultGridType: GridType.HEX,
    gridSize: 25, // Approx hex size in mm
    scaleRatio: 10, // Rough scale for miniatures
  },
  {
    id: 'pathfinder',
    name: 'Pathfinder',
    defaultGridType: GridType.SQUARE,
    gridSize: 25.4, // 1 inch in mm
    scaleRatio: 5, // 1 square = 5 feet
  },
  {
    id: 'custom',
    name: 'Custom',
    defaultGridType: GridType.SQUARE,
    gridSize: 10, // Default 10mm
    scaleRatio: 1, // 1:1 ratio
  },
];

// Elevation data source
export enum ElevationDataSource {
  USGS = 'usgs',
  OPEN_TOPOGRAPHY = 'openTopography',
  AWS_TERRAIN = 'awsTerrain',
}

// Export format
export enum ExportFormat {
  PDF = 'pdf',
  PNG = 'png',
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