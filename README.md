# Tabletop Terrain Map Generator

A web application for generating realistic 3D terrain maps for tabletop gaming using real-world elevation data.

## Latest Updates (June 20, 2024)

- Fixed TypeScript configuration to resolve build errors
- Consolidated all development into the main branch
- Fixed map display issues with Leaflet integration
- Improved component structure and stylesheet organization
- Created a dedicated SimpleMap component for better map handling
- Enhanced application responsiveness across different screen sizes
- Optimized Vercel deployment with custom build script
- Fixed Leaflet and Leaflet Draw icon visibility in production

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

### Vercel Deployment Notes

The application uses a custom build process for Vercel to handle TypeScript errors and ensure proper asset loading:

- Custom `vercel-build.sh` script to handle TypeScript errors gracefully
- Modified `vercel.json` with routes configuration for Leaflet assets
- CDN references for Leaflet icons to ensure cross-platform compatibility
- Custom headers for optimal caching and security

If you encounter issues with Leaflet icons not appearing in production:

1. Check browser console for 404 errors related to icon paths
2. Verify that the CSS and JS imports for Leaflet are in the correct order
3. Use utility function `fixLeafletIcons()` to explicitly set icon paths

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

## Troubleshooting

### Missing Map Controls

If map controls are not visible:
- Check browser console for errors
- Verify that both Leaflet and Leaflet Draw CSS are properly loaded 
- Ensure z-index values allow controls to be displayed above other elements

### TypeScript Build Errors

The project uses a custom TypeScript configuration that:
- Sets `noUnusedLocals` and `noUnusedParameters` to `false` to allow development flexibility
- Uses `--emitOnError false` during build to prevent TypeScript warnings from failing builds

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
