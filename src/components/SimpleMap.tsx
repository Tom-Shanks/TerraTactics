import { useRef, useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet-draw';
import '../styles/SimpleMap.css';
import { Bounds } from '../types';

// Make sure Leaflet's default icons work
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface SimpleMapProps {
  onAreaSelected: (bounds: Bounds) => void;
}

const SimpleMap: React.FC<SimpleMapProps> = ({ onAreaSelected }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [drawnItems, setDrawnItems] = useState<L.FeatureGroup | null>(null);

  useEffect(() => {
    // Log when component mounts
    console.log('SimpleMap component mounting');
    
    // Check if Leaflet is available
    if (!L) {
      console.error('Leaflet library not loaded!');
      return;
    }

    // Only initialize the map if it doesn't exist and the container is ready
    if (!mapInstance && mapRef.current) {
      console.log('Initializing map...');
      
      try {
        // Create the map instance
        const map = L.map(mapRef.current, {
          center: [37.7749, -122.4194], // Default center (San Francisco)
          zoom: 10,
          zoomControl: true,
        });
        
        // Add the tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);
        
        // Create feature group for drawn items
        const items = new L.FeatureGroup();
        map.addLayer(items);
        
        // Initialize the draw control
        const drawControl = new L.Control.Draw({
          draw: {
            polyline: false,
            polygon: false,
            circle: false,
            circlemarker: false,
            marker: false,
            rectangle: {
              shapeOptions: {
                color: '#3388ff',
                weight: 3,
              },
              metric: true,
            },
          },
          edit: {
            featureGroup: items,
          },
        });
        
        map.addControl(drawControl);
        
        // Event handler for when a rectangle is created
        map.on(L.Draw.Event.CREATED, (event: any) => {
          const layer = event.layer;
          items.addLayer(layer);
          
          // Extract bounds from the drawn rectangle
          const bounds = layer.getBounds();
          console.log('Rectangle created with bounds:', bounds);
          
          // Convert to our Bounds type
          const areaBounds: Bounds = {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest(),
          };
          
          // Call the callback with the selected area
          onAreaSelected(areaBounds);
        });
        
        // Event for when drawn items are edited
        map.on(L.Draw.Event.EDITED, (event: any) => {
          const layers = event.layers;
          let newBounds: Bounds | null = null;
          
          layers.eachLayer((layer: any) => {
            const bounds = layer.getBounds();
            newBounds = {
              north: bounds.getNorth(),
              south: bounds.getSouth(),
              east: bounds.getEast(),
              west: bounds.getWest(),
            };
          });
          
          if (newBounds) {
            console.log('Rectangle edited with new bounds:', newBounds);
            onAreaSelected(newBounds);
          }
        });
        
        // Event for when drawn items are deleted
        map.on(L.Draw.Event.DELETED, () => {
          console.log('Rectangle deleted, clearing selection');
          // Send null bounds to indicate no selection
          onAreaSelected({
            north: 0,
            south: 0,
            east: 0,
            west: 0,
          });
        });
        
        // Store the map instance
        setMapInstance(map);
        setDrawnItems(items);
        
        console.log('Map initialization complete');
        
        // Force a resize after a short delay to ensure proper rendering
        setTimeout(() => {
          if (map) {
            console.log('Invalidating map size');
            map.invalidateSize();
          }
        }, 100);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }
    
    // Cleanup function to destroy the map when component unmounts
    return () => {
      if (mapInstance) {
        console.log('Cleaning up map instance');
        mapInstance.remove();
        setMapInstance(null);
        setDrawnItems(null);
      }
    };
  }, [mapInstance, onAreaSelected]);
  
  // Effect to handle window resize events
  useEffect(() => {
    const handleResize = () => {
      if (mapInstance) {
        console.log('Window resized, invalidating map size');
        mapInstance.invalidateSize();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [mapInstance]);

  return (
    <div className="simple-map-container">
      <div ref={mapRef} className="leaflet-map" data-testid="map-element"></div>
    </div>
  );
};

export default SimpleMap;

// Add typings for the window object
declare global {
  interface Window {
    L: any;
  }
} 