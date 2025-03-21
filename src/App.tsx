import { useState, useCallback } from 'react';
import L from 'leaflet';
// Import services
import ElevationService, { ElevationData } from './services/ElevationService';
import ContourService, { ContourLine } from './services/ContourService';
import GridService, { GridCell } from './services/GridService';
import ExportService from './services/ExportService';
import { Bounds, GridType } from './types';
import './App.css';
import TerrainMap from './components/TerrainMap';

function App() {
  // State for app views
  const [appView, setAppView] = useState<'landing' | 'generator'>('landing');
  
  const [selectedArea, setSelectedArea] = useState<L.LatLngBounds | null>(null);
  const [elevationData, setElevationData] = useState<ElevationData | null>(null);
  const [contourData, setContourData] = useState<ContourLine[] | null>(null);
  const [gridData, setGridData] = useState<GridCell[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [contourInterval, setContourInterval] = useState<number>(10);
  const [gridType, setGridType] = useState<GridType>(GridType.SQUARE);
  const [gridSize, setGridSize] = useState<number>(5);

  // Landing page view
  const renderLandingPage = () => {
    return (
      <div className="landing-page">
        <div className="hero">
          <h1>TerraTactics</h1>
          <h2>Tabletop Terrain Map Generator</h2>
          <p>Create realistic topographic maps for your tabletop gaming from real-world locations</p>
          <button className="cta-button" onClick={() => handleViewChange('generator')}>
            Start Creating Maps
          </button>
        </div>
        
        <div className="features">
          <div className="feature">
            <h3>Real World Terrain</h3>
            <p>Select any location on Earth and extract accurate elevation data</p>
          </div>
          <div className="feature">
            <h3>Custom Contours</h3>
            <p>Generate contour lines with adjustable intervals to match your game's scale</p>
          </div>
          <div className="feature">
            <h3>Game-Ready Grids</h3>
            <p>Overlay hex or square grids sized for popular game systems</p>
          </div>
          <div className="feature">
            <h3>High Quality Export</h3>
            <p>Download your maps in print-ready PDF or PNG format</p>
          </div>
        </div>
        
        <div className="getting-started">
          <h2>How It Works</h2>
          <ol>
            <li>Select an area on the interactive map</li>
            <li>Generate terrain data with customizable contour intervals</li>
            <li>Add a grid overlay sized for your game system</li>
            <li>Export your map for printing or digital use</li>
          </ol>
          <button onClick={() => handleViewChange('generator')}>
            Get Started Now
          </button>
        </div>
      </div>
    );
  };

  // Change view handler with cleanup
  const handleViewChange = useCallback((view: 'landing' | 'generator') => {
    // Reset state when changing views
    if (view === 'landing') {
      setSelectedArea(null);
      setElevationData(null);
      setContourData(null);
      setGridData(null);
    }
    
    setAppView(view);
  }, []);

  // Handle area selection from the map
  const handleAreaSelected = useCallback((bounds: L.LatLngBounds) => {
    console.log('Area selected:', bounds);
    if (bounds.isValid() && bounds.getNorth() !== 0) {
      console.log('Setting valid bounds:', {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      });
      setSelectedArea(bounds);
    } else {
      console.log('Invalid bounds received, clearing selection');
      setSelectedArea(null);
    }
  }, []);

  // Generator view
  const renderGenerator = () => {
    // Original app content
    return (
      <div className="app-container">
        <header>
          <h1>Tabletop Terrain Map Generator</h1>
          <button onClick={() => handleViewChange('landing')}>Back to Home</button>
        </header>
        
        <div className="map-container">
          <TerrainMap onAreaSelected={handleAreaSelected} />
          <div className="instructions">
            <p>Use the rectangle tool to select an area for your terrain map.</p>
          </div>
        </div>
        
        {/* Controls UI */}
        <div className="controls-container">
          {selectedArea && (
            <div className="selected-bounds-info">
              <h3>Selected Area</h3>
              <p>
                North: {selectedArea.getNorth().toFixed(6)}, South: {selectedArea.getSouth().toFixed(6)},
                East: {selectedArea.getEast().toFixed(6)}, West: {selectedArea.getWest().toFixed(6)}
              </p>
              <button onClick={handleGenerateElevationData} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Elevation Data'}
              </button>
            </div>
          )}
          
          {elevationData && (
            <div className="control-section">
              <h2>Contour Settings</h2>
              <div className="form-group">
                <label htmlFor="contour-interval">Contour Interval (meters):</label>
                <input
                  id="contour-interval"
                  type="number"
                  min="1"
                  max="100"
                  value={contourInterval}
                  onChange={(e) => setContourInterval(parseInt(e.target.value))}
                />
              </div>
              <button onClick={handleGenerateContours} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Contours'}
              </button>
            </div>
          )}
          
          {contourData && (
            <div className="control-section">
              <h2>Grid Settings</h2>
              <div className="form-group">
                <label htmlFor="grid-type">Grid Type:</label>
                <select
                  id="grid-type"
                  value={gridType}
                  onChange={(e) => setGridType(e.target.value as GridType)}
                >
                  <option value={GridType.SQUARE}>Square</option>
                  <option value={GridType.HEX}>Hexagon</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="grid-size">Grid Size (mm):</label>
                <input
                  id="grid-size"
                  type="number"
                  min="1"
                  max="50"
                  value={gridSize}
                  onChange={(e) => setGridSize(parseInt(e.target.value))}
                />
              </div>
              <button onClick={handleGenerateGrid} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Grid'}
              </button>
            </div>
          )}
          
          {gridData && (
            <div className="control-section">
              <h2>Export</h2>
              <div className="export-buttons">
                <button onClick={() => handleExport('png')} disabled={loading}>
                  Export as PNG
                </button>
                <button onClick={() => handleExport('pdf')} disabled={loading}>
                  Export as PDF
                </button>
              </div>
            </div>
          )}
          
          {error && <div className="error-message">{error}</div>}
        </div>
        
        <footer>
          <p>
            TerraTactics uses elevation data from multiple open sources including USGS and AWS Terrain Tiles.
            No API keys required.
          </p>
        </footer>
      </div>
    );
  };

  const handleGenerateElevationData = async () => {
    if (!selectedArea) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const bounds: Bounds = {
        north: selectedArea.getNorth(),
        south: selectedArea.getSouth(),
        east: selectedArea.getEast(),
        west: selectedArea.getWest()
      };
      
      const data = await ElevationService.getElevationData(bounds);
      setElevationData(data);
    } catch (err) {
      setError(`Failed to fetch elevation data: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContours = async () => {
    if (!elevationData) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const contours = ContourService.generateContours(elevationData, contourInterval);
      setContourData(contours);
    } catch (err) {
      setError(`Failed to generate contours: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateGrid = async () => {
    if (!selectedArea) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const bounds: Bounds = {
        north: selectedArea.getNorth(),
        south: selectedArea.getSouth(),
        east: selectedArea.getEast(),
        west: selectedArea.getWest()
      };
      
      const grid = GridService.generateGrid(bounds, gridType, gridSize);
      setGridData(grid);
    } catch (err) {
      setError(`Failed to generate grid: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'png' | 'pdf') => {
    if (!selectedArea || !contourData || !gridData) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const bounds: Bounds = {
        north: selectedArea.getNorth(),
        south: selectedArea.getSouth(),
        east: selectedArea.getEast(),
        west: selectedArea.getWest()
      };
      
      // Create export options
      const renderOptions = {};
      const exportOptions = {
        format: format,
        filename: `terrain-map`,
        paperSize: 'a4' as const,
        orientation: 'landscape' as const,
        dpi: 300,
        includeMetadata: true
      };
      
      // Use the public exportMap method
      const url = await ExportService.exportMap(
        bounds,
        contourData,
        gridData,
        renderOptions,
        exportOptions
      );
      
      // Create a temporary link and click it to download
      const link = document.createElement('a');
      link.href = url;
      link.download = `terrain-map.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      setError(`Failed to export map: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      {appView === 'landing' ? renderLandingPage() : renderGenerator()}
    </div>
  );
}

export default App;
