# Tabletop Terrain Map Generator

A web application for generating realistic 3D terrain maps for tabletop gaming using real-world elevation data.

## Latest Updates (June 20, 2024)

- Fixed TypeScript configuration to resolve build errors
- Consolidated all development into the main branch
- Fixed map display issues with Leaflet integration
- Improved component structure and stylesheet organization
- Created a dedicated SimpleMap component for better map handling
- Enhanced application responsiveness across different screen sizes

## Features

- Select any real-world location for your terrain map
- Generate contour lines from elevation data
- Add square or hex grids sized for your game system
- Export high-quality printable maps

## Development

This project is built with:
- React + TypeScript
- Leaflet for interactive maps
- AWS Terrain Tiles and USGS 3DEP for elevation data

> **Note**: This project uses `main` as the primary branch. All development and contributions should target the `main` branch.

## Getting Started

```bash
# Clone the repository
git clone https://github.com/your-username/terrain-map-generator.git

# Install dependencies
cd terrain-map-generator
npm install

# Start development server
npm run dev
```

## Deployment

The application is deployed on Vercel. Changes pushed to the main branch are automatically deployed.

## Technical Details

This application is built with:
- React
- TypeScript
- Leaflet for mapping
- Vercel for hosting

## Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Tom-Shanks/TerraTactics.git

# Navigate to the project directory
cd TerraTactics

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Building for Production

```bash
# Build for production
npm run build

# Preview the production build
npm run preview
```

## Deployment

The application is configured for easy deployment to Vercel:

1. Fork or clone this repository
2. Connect it to your Vercel account
3. Deploy with default settings (the vercel.json file handles the configuration)

## Technologies Used

- React with TypeScript
- Leaflet for map selection
- D3.js for contour generation
- GeoTIFF.js for elevation data processing
- jsPDF for PDF export
- Web Workers for non-blocking data processing

## Data Sources

This application uses open, freely available elevation data sources:

- USGS 3DEP (3D Elevation Program)
- OpenTopography public data
- AWS Terrain Tiles

## License

MIT
