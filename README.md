# TerraTactics - Tabletop Terrain Map Generator

A web application for generating realistic terrain maps for tabletop gaming from real-world locations.

## Features

- Select any location on Earth using an interactive map
- Generate accurate elevation data
- Create contour lines with adjustable intervals
- Add hex or square grids sized for popular game systems
- Export maps as high-quality PDF or PNG

## Recent Updates

- Fixed map initialization issues
- Added responsive design for mobile and desktop
- Improved drawing tools functionality
- Enhanced error handling
- Merged all branches to ensure consistency

## Getting Started

1. Visit the application at [TerraTactics](https://terratactics.vercel.app/)
2. Select "Start Creating Maps" to begin
3. Use the rectangle tool to select an area on the map
4. Generate elevation data and customize contour intervals
5. Add a grid overlay and export your map

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
