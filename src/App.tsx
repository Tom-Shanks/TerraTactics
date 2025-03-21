import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// Import Leaflet Draw
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
// Import our custom Leaflet Draw setup
import './utils/leaflet-draw-setup';
import ElevationService, { ElevationData } from './services/ElevationService';
import ContourService, { ContourLine } from './services/ContourService';
import GridService, { GridCell } from './services/GridService';
import ExportService from './services/ExportService';
import { Bounds, GridType } from './types';
import './App.css';

// This ensures the Leaflet icons work correctly
import { Icon } from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet's default icon issue
let DefaultIcon = Icon.Default.prototype;
DefaultIcon.options.iconUrl = icon;
DefaultIcon.options.shadowUrl = iconShadow;
Icon.Default.mergeOptions({
  iconRetinaUrl: icon,
  iconUrl: icon,
  shadowUrl: iconShadow,
});

function App() {
  // State for app views
  const [appView, setAppView] = useState<'landing' | 'generator'>('landing');
  
  const [selectedArea, setSelectedArea] = useState<L.LatLngBounds | null>(null);
  const [elevationData, setElevationData] = useState<ElevationData | null>(null);
  const [contourData, setContourData] = useState<ContourLine[] | null>(null);
  const [gridData, setGridData] = useState<GridCell[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mapIsInitialized, setMapIsInitialized] = useState<boolean>(false);

  // Form state
  const [contourInterval, setContourInterval] = useState<number>(10);
  const [gridType, setGridType] = useState<GridType>(GridType.SQUARE);
  const [gridSize, setGridSize] = useState<number>(5);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const drawnItems = useRef<L.FeatureGroup | null>(null);

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
    // Clean up the previous view as needed
    if (view === 'landing' && mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
      drawnItems.current = null;
      setMapIsInitialized(false);
    }
    
    setAppView(view);
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
          <div ref={mapRef} className="map"></div>
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
  
  // Initialize map with Leaflet
  useEffect(() => {
    if (appView === 'generator' && mapRef.current && !mapIsInitialized) {
      // Clean up any existing map instance first
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        drawnItems.current = null;
      }
      
      // Initialize the map with a short delay to ensure DOM is ready
      const initTimer = setTimeout(() => {
        try {
          if (!mapRef.current || mapInstance.current) return;
          
          // Create a new map instance
          const map = L.map(mapRef.current).setView([37.7749, -122.4194], 13);
          mapInstance.current = map;

          // Add the tile layer
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(map);

          // Initialize the drawn items layer
          drawnItems.current = new L.FeatureGroup();
          map.addLayer(drawnItems.current);

          // Make sure Leaflet Draw exists
          if (!L.Control || !L.Control.Draw) {
            console.error("Leaflet Draw plugin not available");
            throw new Error("Leaflet Draw plugin not available");
          }

          // Add draw control
          try {
            // Create draw control explicitly using the Draw variable we defined
            const drawControl = new L.Control.Draw({
              edit: {
                featureGroup: drawnItems.current,
              },
              draw: {
                polyline: false,
                polygon: false,
                circle: false,
                marker: false,
                circlemarker: false,
                rectangle: {
                  shapeOptions: {
                    color: '#3388ff',
                    weight: 2
                  }
                }
              }
            });
            map.addControl(drawControl);
          } catch (drawError) {
            console.error("Error initializing draw control:", drawError);
            throw drawError;
          }

          // Event handler for when a shape is drawn
          map.on(L.Draw.Event.CREATED, (event: any) => {
            const layer = event.layer;
            setSelectedArea(layer.getBounds());
            
            // Clear any existing drawings
            if (drawnItems.current) {
              drawnItems.current.clearLayers();
              drawnItems.current.addLayer(layer);
            }
          });
          
          // Handle edit events
          map.on(L.Draw.Event.EDITED, (event: any) => {
            const layers = event.layers;
            let newBounds = null;
            
            layers.eachLayer((layer: any) => {
              newBounds = layer.getBounds();
            });
            
            if (newBounds) {
              setSelectedArea(newBounds);
            }
          });
          
          // Handle delete events
          map.on(L.Draw.Event.DELETED, () => {
            setSelectedArea(null);
          });
          
          // Invalidate map size after rendering
          const resizeTimer = setTimeout(() => {
            map.invalidateSize();
          }, 100);
          
          setMapIsInitialized(true);
          
          return () => clearTimeout(resizeTimer);
        } catch (error) {
          console.error("Error initializing map:", error);
          setError(`Failed to initialize map: ${error instanceof Error ? error.message : String(error)}`);
        }
      }, 100);
      
      // Cleanup function for the initialization timer
      return () => clearTimeout(initTimer);
    }
  }, [appView, mapIsInitialized]);

  // Add a window resize handler to ensure the map stays responsive
  useEffect(() => {
    const handleResize = () => {
      if (mapInstance.current) {
        mapInstance.current.invalidateSize();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

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
