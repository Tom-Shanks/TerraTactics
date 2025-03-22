import { useEffect, useRef } from 'react';
import './SimpleMap.css';

// This is a simple Leaflet map implementation that avoids React integration issues
interface SimpleMapProps {
  onAreaSelected?: (bounds: any) => void;
}

const SimpleMap = ({ onAreaSelected }: SimpleMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Skip if window.L is not available or if mapInstance already exists
    if (!window.L || mapInstanceRef.current) return;

    console.log('Initializing simple map with direct Leaflet API');
    
    // Create map instance
    const mapContainer = mapContainerRef.current;
    if (!mapContainer) return;
    
    try {
      // Clear any previous content
      mapContainer.innerHTML = '';
      
      // Create map with clear dimensions
      mapContainer.style.height = '500px';
      mapContainer.style.width = '100%';
      mapContainer.style.position = 'relative';
      mapContainer.style.display = 'block';
      mapContainer.style.border = '3px solid purple';
      
      // Initialize map
      const mapInstance = window.L.map(mapContainer).setView([51.505, -0.09], 13);
      
      // Add tile layer
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstance);
      
      // Store the map instance
      mapInstanceRef.current = mapInstance;
      
      // Add drawing controls if available
      if (window.L.drawVersion) {
        const drawnItems = new window.L.FeatureGroup();
        mapInstance.addLayer(drawnItems);
        
        const drawControl = new window.L.Control.Draw({
          draw: {
            polygon: false,
            polyline: false,
            circle: false,
            circlemarker: false,
            marker: false,
            rectangle: {
              shapeOptions: {
                color: '#ff0000',
                weight: 3
              }
            }
          },
          edit: {
            featureGroup: drawnItems
          }
        });
        
        mapInstance.addControl(drawControl);
        
        // Handle draw events
        mapInstance.on('draw:created', function(e: any) {
          const layer = e.layer;
          drawnItems.addLayer(layer);
          
          if (layer.getBounds && onAreaSelected) {
            onAreaSelected(layer.getBounds());
          }
        });
      }
      
      // Force a resize after a delay
      setTimeout(() => {
        mapInstance.invalidateSize();
        console.log('Map size invalidated');
      }, 500);
      
    } catch (error) {
      console.error('Error initializing map:', error);
    }
    
    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [onAreaSelected]);
  
  return (
    <div className="simple-map-wrapper">
      <div ref={mapContainerRef} className="simple-map-container" />
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