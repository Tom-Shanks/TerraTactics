import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';

// Fix Leaflet's default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Define the prop types
interface TerrainMapProps {
  onAreaSelected: (bounds: L.LatLngBounds) => void;
}

// Define types for Leaflet Draw events
interface DrawCreatedEvent {
  layer: L.Layer;
  layerType: string;
}

interface DrawEditedEvent {
  layers: L.LayerGroup;
}

// Set up the default icon for Leaflet
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
  const handleCreated = (e: DrawCreatedEvent) => {
    const { layer } = e;
    
    // Clear any existing layers
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
      featureGroupRef.current.addLayer(layer);
    }
    
    // Get the bounds of the new shape and pass them to the parent component
    const bounds = (layer as L.Rectangle).getBounds();
    onAreaSelected(bounds);
  };
  
  // Handle the edited event from Leaflet.Draw
  const handleEdited = (e: DrawEditedEvent) => {
    const layers = e.layers;
    let editedBounds = null;
    
    layers.eachLayer((layer) => {
      editedBounds = (layer as L.Rectangle).getBounds();
    });
    
    if (editedBounds) {
      onAreaSelected(editedBounds);
    }
  };
  
  // Handle the deleted event from Leaflet.Draw
  const handleDeleted = () => {
    onAreaSelected(new L.LatLngBounds([0, 0], [0, 0]));
  };
  
  // Type for the whenReady callback
  interface MapReadyEvent {
    target: L.Map;
  }
  
  return (
    <MapContainer
      center={[37.7749, -122.4194]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      whenReady={(mapInstance: MapReadyEvent) => setMap(mapInstance.target)}
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
  );
};

export default TerrainMap; 