import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';

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

const TerrainMap: React.FC<TerrainMapProps> = ({ onAreaSelected }) => {
  const [map, setMap] = useState<L.Map | null>(null);
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  
  // Make sure Leaflet is initialized
  useEffect(() => {
    // Add a small delay to ensure the map renders properly
    if (map) {
      setTimeout(() => {
        map.invalidateSize();
        
        // Add a reminder message to use the drawing tools
        const messageDiv = document.createElement('div');
        messageDiv.style.position = 'absolute';
        messageDiv.style.top = '10px';
        messageDiv.style.left = '60px';
        messageDiv.style.zIndex = '1000';
        messageDiv.style.backgroundColor = 'white';
        messageDiv.style.padding = '5px';
        messageDiv.style.borderRadius = '5px';
        messageDiv.style.boxShadow = '0 0 5px rgba(0,0,0,0.2)';
        messageDiv.innerHTML = 'Click the rectangle tool (▢) to start drawing';
        
        // Add to map container and remove after 10 seconds
        const mapContainer = map.getContainer();
        mapContainer.appendChild(messageDiv);
        setTimeout(() => {
          messageDiv.style.display = 'none';
        }, 10000);
      }, 500);
    }
  }, [map]);
  
  // Effect to handle map resizing
  useEffect(() => {
    if (!map) return;
    
    const handleResize = () => {
      map.invalidateSize();
    };
    
    window.addEventListener('resize', handleResize);
    
    // Initial size invalidation after a short delay to ensure map is fully rendered
    const initialResizeTimeout = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(initialResizeTimeout);
    };
  }, [map]);
  
  // Handle the created event from Leaflet.Draw
  const handleCreated = (e: any) => {
    const { layer } = e;
    
    // Clear any existing layers
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
      featureGroupRef.current.addLayer(layer);
    }
    
    // Get the bounds of the new shape and pass them to the parent component
    if (layer.getBounds) {
      const bounds = layer.getBounds();
      onAreaSelected(bounds);
    }
  };
  
  // Handle the edited event from Leaflet.Draw
  const handleEdited = (e: any) => {
    const layers = e.layers;
    let editedBounds = null;
    
    layers.eachLayer((layer: any) => {
      if (layer.getBounds) {
        editedBounds = layer.getBounds();
      }
    });
    
    if (editedBounds) {
      onAreaSelected(editedBounds);
    }
  };
  
  // Handle the deleted event from Leaflet.Draw
  const handleDeleted = () => {
    onAreaSelected(new L.LatLngBounds([0, 0], [0, 0]));
  };
  
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={[37.7749, -122.4194]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        whenReady={(mapInstance: any) => setMap(mapInstance.target)}
      >
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
            edit={{
              featureGroup: featureGroupRef.current,
              remove: true
            }}
          />
        </FeatureGroup>
      </MapContainer>
    </div>
  );
};

export default TerrainMap; 