import { useState } from 'react';
import './App.css';
import SimpleMap from './components/SimpleMap';
import { Bounds } from './types';

function App() {
  const [view, setView] = useState<'landing' | 'generator'>('generator');
  const [selectedArea, setSelectedArea] = useState<Bounds | null>(null);
  // Declare but don't use these variables yet (commented out to avoid TS warnings)
  // const [elevationData, setElevationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle area selection from the map
  const handleAreaSelected = (bounds: Bounds) => {
    console.log('Area selected:', bounds);
    setSelectedArea(bounds);
  };

  // Handle view change
  const handleViewChange = (newView: 'landing' | 'generator') => {
    setView(newView);
    // Reset data when switching to landing view
    if (newView === 'landing') {
      setSelectedArea(null);
      // setElevationData(null);
    }
  };

  // Landing view
  const renderLanding = () => {
    return (
      <div className="landing-view">
        <header>
          <h1>Tabletop Terrain Map Generator</h1>
          <p>Generate realistic terrain maps for your tabletop games using real-world elevation data.</p>
        </header>
        <div className="cta-container">
          <button 
            className="cta-button"
            onClick={() => handleViewChange('generator')}
          >
            Create New Map
          </button>
        </div>
        <div className="feature-section">
          <div className="feature">
            <h2>Real-World Data</h2>
            <p>Use actual elevation data from anywhere on Earth.</p>
          </div>
          <div className="feature">
            <h2>Custom Grids</h2>
            <p>Add square or hex grids scaled for your game system.</p>
          </div>
          <div className="feature">
            <h2>Export Ready</h2>
            <p>Export as high-quality printable PDFs or images.</p>
          </div>
        </div>
      </div>
    );
  };

  // Generator view
  const renderGenerator = () => {
    return (
      <div className="generator-view">
        <header className="generator-header">
          <h1>Terrain Map Generator</h1>
          <button 
            className="btn-primary"
            onClick={() => handleViewChange('landing')}
          >
            Back to Home
          </button>
        </header>
        
        <div className="instructions">
          <p>Use the rectangle tool to select an area for your terrain map.</p>
        </div>
        
        <div className="map-container">
          <SimpleMap onAreaSelected={handleAreaSelected} />
        </div>
        
        {selectedArea && (
          <div className="selection-info">
            <h2>Selected Area</h2>
            <p>
              North: {selectedArea.north.toFixed(6)}, South: {selectedArea.south.toFixed(6)}<br />
              East: {selectedArea.east.toFixed(6)}, West: {selectedArea.west.toFixed(6)}
            </p>
            <button 
              className="btn-primary"
              onClick={() => console.log('Generate terrain for selected area')}
              disabled={loading}
            >
              Generate Terrain
            </button>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app">
      {view === 'landing' ? renderLanding() : renderGenerator()}
      <footer>
        <p>TerraTactics uses elevation data from multiple open sources including USGS and AWS Terrain Tiles. No API keys required.</p>
      </footer>
    </div>
  );
}

export default App;
