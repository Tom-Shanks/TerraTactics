# Tabletop Terrain Map Generator

A web-based tool that allows tabletop gamers to select real-world locations, extract elevation data, generate topographic maps with contour lines, overlay game-specific grids (hexes or squares), and export print-ready maps for tabletop gaming.

## Features

- Select real-world locations using an interactive map
- Extract elevation data from multiple open sources
- Generate contour lines with adjustable intervals
- Overlay game-specific grids (hex or square)
- Export high-quality print-ready PDF or PNG files
- Works entirely client-side with no API keys required
- Supports common tabletop gaming scales (D&D, Warhammer, etc.)

## How to Use

1. **Select Map Area**: Use the rectangle tool on the map to select the area you want to use for your tabletop game.
2. **Generate Elevation Data**: The application will fetch elevation data from open sources like USGS, OpenTopography, or AWS Terrain Tiles.
3. **Configure Contours**: Adjust contour intervals and styling to match your desired terrain features.
4. **Apply Grid**: Choose a grid type (hex or square) and configure it for your specific game system.
5. **Export**: Generate a high-resolution PDF or PNG file ready for printing.

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
