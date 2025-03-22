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

// Force the Leaflet default icon to be available
const DefaultIcon = L.Icon.Default.prototype;
DefaultIcon.options.iconUrl = icon;
DefaultIcon.options.shadowUrl = iconShadow;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: icon,
  iconUrl: icon,
  shadowUrl: iconShadow,
});

// Create a helper component to initialize map features after the map is ready
const MapInitializer = ({ onMapReady }: { onMapReady: (map: L.Map) => void }) => {
  const map = useMap();
  
  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);
  
  return null;
};

const TerrainMap: React.FC<TerrainMapProps> = ({ onAreaSelected }) => {
  const [map, setMap] = useState<L.Map | null>(null);
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  
  // Initialize the map
  const handleMapReady = (mapInstance: L.Map) => {
    console.log("Map is ready:", mapInstance);
    setMap(mapInstance);
    
    // Force invalidate size to ensure the map renders correctly
    setTimeout(() => {
      mapInstance.invalidateSize();
      
      // Add a helper tooltip to show users how to use the drawing tools
      const helpDiv = document.createElement('div');
      helpDiv.style.position = 'absolute';
      helpDiv.style.top = '70px';
      helpDiv.style.left = '10px';
      helpDiv.style.zIndex = '1000';
      helpDiv.style.backgroundColor = 'white';
      helpDiv.style.padding = '5px 10px';
      helpDiv.style.borderRadius = '4px';
      helpDiv.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
      helpDiv.innerHTML = 'Click the rectangle icon <span style="font-size: 1.2em">▢</span> in the toolbar to draw an area';
      
      const mapContainer = mapInstance.getContainer();
      mapContainer.appendChild(helpDiv);
      
      // Hide after 15 seconds
      setTimeout(() => {
        helpDiv.style.display = 'none';
      }, 15000);
    }, 100);
  };
  
  // Effect to handle map resizing
  useEffect(() => {
    if (!map) return;
    
    const handleResize = () => {
      map.invalidateSize();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);
  
  // Handle the created event from Leaflet.Draw
  const handleCreated = (e: any) => {
    console.log("Shape created:", e);
    const { layer, layerType } = e;
    
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
    <div className="map" style={{ width: '100%', height: '100%', position: 'relative' }}>
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