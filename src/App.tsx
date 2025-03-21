import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import ElevationService, { ElevationData } from './services/ElevationService';
import ContourService, { ContourLine } from './services/ContourService';
import GridService, { GridCell } from './services/GridService';
import ExportService from './services/ExportService';
import { Bounds, GridType } from './types';
import './App.css';

function App() {
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

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      // Initialize the map
      mapInstance.current = L.map(mapRef.current).setView([37.7749, -122.4194], 13);
      
      // Add base tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstance.current);

      // Add drawing controls
      const drawControl = new L.Control.Draw({
        draw: {
          polyline: false,
          polygon: false,
          circle: false,
          marker: false,
          circlemarker: false,
          rectangle: {
            shapeOptions: {
              color: '#3388ff'
            }
          }
        },
        edit: {
          featureGroup: new L.FeatureGroup()
        }
      });
      
      mapInstance.current.addControl(drawControl);
      
      // Add drawn rectangle layer group
      const drawnItems = new L.FeatureGroup();
      mapInstance.current.addLayer(drawnItems);
      
      // Event handler for when a rectangle is drawn
      mapInstance.current.on(L.Draw.Event.CREATED, (event: any) => {
        const layer = event.layer;
        drawnItems.clearLayers();
        drawnItems.addLayer(layer);
        setSelectedArea(layer.getBounds());
      });

      return () => {
        if (mapInstance.current) {
          mapInstance.current.remove();
          mapInstance.current = null;
        }
      };
    }
  }, []);

  // Handle fetching elevation data
  const fetchElevationData = async () => {
    if (!selectedArea) {
      setError('Please select an area on the map first');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
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

  // Generate contours
  const generateContours = () => {
    if (!elevationData) {
      setError('No elevation data available');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const contours = ContourService.generateContours(elevationData, contourInterval);
      setContourData(contours);
    } catch (err) {
      setError(`Failed to generate contours: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Generate grid
  const generateGrid = () => {
    if (!selectedArea) {
      setError('Please select an area on the map first');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const bounds: Bounds = {
        north: selectedArea.getNorth(),
        south: selectedArea.getSouth(),
        east: selectedArea.getEast(),
        west: selectedArea.getWest()
      };
      
      const config = {
        type: gridType,
        gridSize: gridSize,
        scaleRatio: 1,
        showLabels: true,
        labelCharset: 'alphanumeric' as const
      };
      
      const grid = GridService.generateGrid(bounds, config);
      setGridData(grid);
    } catch (err) {
      setError(`Failed to generate grid: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Render and export map
  const exportMap = async (format: 'png' | 'pdf') => {
    if (!elevationData || !contourData || !gridData) {
      setError('Please generate all data before exporting');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (selectedArea) {
        const bounds: Bounds = {
          north: selectedArea.getNorth(),
          south: selectedArea.getSouth(),
          east: selectedArea.getEast(),
          west: selectedArea.getWest()
        };
        
        // Export the map using ExportService
        const url = await ExportService.exportMap(
          bounds,
          contourData,
          gridData,
          {
            width: 1000,
            height: 1000,
            showContourLabels: true,
            contourColors: {
              regular: '#8B4513',
              major: '#654321',
              label: '#000000'
            },
            gridColor: 'rgba(0, 0, 0, 0.5)',
            backgroundColor: '#FFFFFF',
            showScaleBar: true,
            showGridLabels: true
          },
          {
            format,
            filename: `terrain-map-${new Date().toISOString().split('T')[0]}`
          }
        );
        
        // Create a download link and click it
        const link = ExportService.createDownloadLink(
          url,
          `terrain-map.${format}`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Revoke the object URL to free memory
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
    } catch (err) {
      setError(`Failed to export map: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>Tabletop Terrain Map Generator</h1>
      </header>
      
      <main>
        <div className="map-container">
          <div ref={mapRef} className="map" style={{ height: '500px' }}></div>
          <div className="instructions">
            <p>Use the rectangle tool to select an area for your terrain map.</p>
          </div>
        </div>
        
        <div className="controls-container">
          <div className="control-section">
            <h2>Elevation Data</h2>
            <button onClick={fetchElevationData} disabled={!selectedArea || loading}>
              {loading ? 'Loading...' : 'Fetch Elevation Data'}
            </button>
            {elevationData && <div className="success-message">✓ Elevation data loaded</div>}
          </div>
          
          <div className="control-section">
            <h2>Contour Settings</h2>
            <div className="form-group">
              <label>Contour Interval (m):</label>
              <input 
                type="number" 
                value={contourInterval} 
                onChange={(e) => setContourInterval(Number(e.target.value))} 
                min="1"
                max="100"
              />
            </div>
            <button onClick={generateContours} disabled={!elevationData || loading}>
              {loading ? 'Generating...' : 'Generate Contours'}
            </button>
            {contourData && <div className="success-message">✓ Contours generated</div>}
          </div>
          
          <div className="control-section">
            <h2>Grid Settings</h2>
            <div className="form-group">
              <label>Grid Type:</label>
              <select 
                value={gridType} 
                onChange={(e) => setGridType(e.target.value as GridType)}
              >
                <option value={GridType.SQUARE}>Square</option>
                <option value={GridType.HEX}>Hexagonal</option>
              </select>
            </div>
            <div className="form-group">
              <label>Grid Size (m):</label>
              <input 
                type="number" 
                value={gridSize} 
                onChange={(e) => setGridSize(Number(e.target.value))} 
                min="1"
                max="100"
              />
            </div>
            <button onClick={generateGrid} disabled={!selectedArea || loading}>
              {loading ? 'Generating...' : 'Generate Grid'}
            </button>
            {gridData && <div className="success-message">✓ Grid generated</div>}
          </div>
          
          <div className="control-section">
            <h2>Export</h2>
            <div className="export-buttons">
              <button 
                onClick={() => exportMap('png')} 
                disabled={!elevationData || !contourData || !gridData || loading}
              >
                Export as PNG
              </button>
              <button 
                onClick={() => exportMap('pdf')} 
                disabled={!elevationData || !contourData || !gridData || loading}
              >
                Export as PDF
              </button>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </main>
      
      <footer>
        <p>
          This application uses freely available elevation data from USGS, OpenTopography, and AWS Terrain Tiles.
        </p>
      </footer>
    </div>
  );
}

export default App;
