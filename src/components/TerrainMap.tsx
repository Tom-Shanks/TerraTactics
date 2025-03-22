import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';

// Import component styles
import './TerrainMap.css';

// Fix Leaflet's default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Define the prop types
interface TerrainMapProps {
  onAreaSelected: (bounds: L.LatLngBounds) => void;
}

// Ensure Leaflet default icon is set
L.Icon.Default.mergeOptions({
  iconRetinaUrl: icon,
  iconUrl: icon,
  shadowUrl: iconShadow,
});

// Create a helper component to initialize map features after the map is ready
const MapInitializer = ({ onMapReady }: { onMapReady: (map: L.Map) => void }) => {
  const map = useMap();
  
  // Use effect to make sure map is initialized
  useEffect(() => {
    console.log('Map initialized:', map);
    onMapReady(map);
    
    // Force map to recalculate size and redraw
    setTimeout(() => {
      console.log('Invalidating map size...');
      map.invalidateSize(true);
    }, 100);
  }, [map, onMapReady]);
  
  return null;
};

const TerrainMap: React.FC<TerrainMapProps> = ({ onAreaSelected }) => {
  const [map, setMap] = useState<L.Map | null>(null);
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  
  // Initialize the map
  const handleMapReady = (mapInstance: L.Map) => {
    console.log("Map ready!", mapInstance);
    setMap(mapInstance);
    
    // Add visible indicator text for debugging
    const debugElement = document.createElement('div');
    debugElement.style.position = 'absolute';
    debugElement.style.bottom = '10px';
    debugElement.style.right = '10px';
    debugElement.style.backgroundColor = 'white';
    debugElement.style.padding = '5px';
    debugElement.style.zIndex = '1000';
    debugElement.style.border = '1px solid black';
    debugElement.textContent = 'Map is loaded';
    
    mapInstance.getContainer().appendChild(debugElement);
    
    // Add helper text for drawing
    const helpElement = document.createElement('div');
    helpElement.style.position = 'absolute';
    helpElement.style.top = '80px';
    helpElement.style.left = '10px';
    helpElement.style.backgroundColor = 'white';
    helpElement.style.padding = '5px 10px';
    helpElement.style.zIndex = '1000';
    helpElement.style.border = '1px solid #ccc';
    helpElement.style.borderRadius = '4px';
    helpElement.innerHTML = 'Click the <strong>rectangle</strong> button in the toolbar to draw';
    
    mapInstance.getContainer().appendChild(helpElement);
    
    // Force redraw after a delay
    setTimeout(() => {
      mapInstance.invalidateSize(true);
    }, 500);
  };
  
  // Handle the created event from Leaflet.Draw
  const handleCreated = (e: any) => {
    console.log("Shape created:", e);
    const { layer } = e;
    
    try {
      // Clear any existing layers
      if (featureGroupRef.current) {
        featureGroupRef.current.clearLayers();
        featureGroupRef.current.addLayer(layer);
      }
      
      // Get the bounds of the new shape and pass them to the parent component
      if (layer.getBounds) {
        const bounds = layer.getBounds();
        console.log("Bounds created:", bounds);
        onAreaSelected(bounds);
      } else {
        console.error("Layer doesn't have getBounds method:", layer);
      }
    } catch (error) {
      console.error("Error in handleCreated:", error);
    }
  };
  
  // Handle the edited event from Leaflet.Draw
  const handleEdited = (e: any) => {
    console.log("Shape edited:", e);
    try {
      const layers = e.layers;
      let editedBounds = null;
      
      layers.eachLayer((layer: any) => {
        if (layer.getBounds) {
          editedBounds = layer.getBounds();
        }
      });
      
      if (editedBounds) {
        console.log("Bounds updated:", editedBounds);
        onAreaSelected(editedBounds);
      }
    } catch (error) {
      console.error("Error in handleEdited:", error);
    }
  };
  
  // Handle the deleted event from Leaflet.Draw
  const handleDeleted = (e: any) => {
    console.log("Shape deleted:", e);
    onAreaSelected(new L.LatLngBounds([0, 0], [0, 0]));
  };
  
  return (
    <div className="map" style={{ width: '100%', height: '100%', position: 'relative', display: 'block' }}>
      {/* Fallback content in case map doesn't load */}
      <div style={{ 
        position: 'absolute',
        zIndex: 5,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(255,255,255,0.8)',
        padding: '10px',
        borderRadius: '5px'
      }}>
        Loading map...
      </div>
      
      <MapContainer
        center={[37.7749, -122.4194]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <MapInitializer onMapReady={handleMapReady} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FeatureGroup ref={(featureGroup: L.FeatureGroup | null) => {
          featureGroupRef.current = featureGroup;
        }}>
          <EditControl
            position="topleft"
            onCreated={handleCreated}
            onEdited={handleEdited}
            onDeleted={handleDeleted}
            draw={{
              polyline: false,
              polygon: false,
              circle: false,
              circlemarker: false,
              marker: false,
              rectangle: {
                shapeOptions: {
                  color: '#3388ff',
                  weight: 2
                }
              }
            }}
          />
        </FeatureGroup>
      </MapContainer>
    </div>
  );
};

export default TerrainMap; 