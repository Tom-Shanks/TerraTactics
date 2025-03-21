import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import './MapSelector.css';
import { Bounds } from '../types';

interface MapSelectorProps {
  onSelectionComplete: (bounds: Bounds) => void;
}

const MapSelector: React.FC<MapSelectorProps> = ({ onSelectionComplete }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [selectedBounds, setSelectedBounds] = useState<Bounds | null>(null);
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [isAreaTooLarge, setIsAreaTooLarge] = useState(false);
  const rectangleRef = useRef<L.Rectangle | null>(null);
  
  const MAX_AREA_SQ_KM = 100; // Maximum area in square kilometers

  useEffect(() => {
    if (mapRef.current && !map) {
      // Initialize the map
      const leafletMap = L.map(mapRef.current).setView([51.505, -0.09], 13);
      
      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(leafletMap);
      
      // Initialize the draw control
      const drawnItems = new L.FeatureGroup();
      leafletMap.addLayer(drawnItems);
      
      const drawControl = new L.Control.Draw({
        draw: {
          polyline: false,
          polygon: false,
          circle: false,
          marker: false,
          circlemarker: false,
          rectangle: {
            shapeOptions: {
              color: '#3388ff',
              weight: 3
            }
          }
        },
        edit: {
          featureGroup: drawnItems,
          remove: true
        }
      });
      
      leafletMap.addControl(drawControl);
      
      // Event handler for when a rectangle is drawn
      leafletMap.on(L.Draw.Event.CREATED, (e: any) => {
        const layer = e.layer;
        
        // Clear previous selections
        drawnItems.clearLayers();
        
        // Add the new layer
        drawnItems.addLayer(layer);
        
        // Store the rectangle reference
        rectangleRef.current = layer;
        
        const bounds = layer.getBounds();
        const newBounds: Bounds = {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest()
        };
        
        // Calculate area in square kilometers
        const areaSqMeters = calculateArea(bounds);
        const areaSqKm = areaSqMeters / 1000000;
        
        setSelectedBounds(newBounds);
        setSelectedArea(areaSqKm);
        setIsAreaTooLarge(areaSqKm > MAX_AREA_SQ_KM);
      });
      
      // Event handler for when a rectangle is edited
      leafletMap.on(L.Draw.Event.EDITED, (e: any) => {
        const layers = e.layers;
        layers.eachLayer((layer: any) => {
          const bounds = layer.getBounds();
          const newBounds: Bounds = {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
          };
          
          // Calculate area in square kilometers
          const areaSqMeters = calculateArea(bounds);
          const areaSqKm = areaSqMeters / 1000000;
          
          setSelectedBounds(newBounds);
          setSelectedArea(areaSqKm);
          setIsAreaTooLarge(areaSqKm > MAX_AREA_SQ_KM);
        });
      });
      
      // Event handler for when a rectangle is deleted
      leafletMap.on(L.Draw.Event.DELETED, () => {
        setSelectedBounds(null);
        setSelectedArea(null);
        setIsAreaTooLarge(false);
        rectangleRef.current = null;
      });
      
      setMap(leafletMap);
      
      // Cleanup function to remove the map when component unmounts
      return () => {
        leafletMap.remove();
      };
    }
  }, [map]);
  
  // Function to calculate the area of a bounding box in square meters
  const calculateArea = (bounds: L.LatLngBounds): number => {
    const east = bounds.getEast();
    const west = bounds.getWest();
    const north = bounds.getNorth();
    const south = bounds.getSouth();
    
    // Calculate width and height in meters using the Haversine formula
    const width = calculateDistance(
      north, west,
      north, east
    );
    
    const height = calculateDistance(
      north, west,
      south, west
    );
    
    return width * height;
  };
  
  // Haversine formula to calculate distance in meters between two lat/lng points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  const handleGenerateMap = () => {
    if (selectedBounds && !isAreaTooLarge) {
      onSelectionComplete(selectedBounds);
    }
  };
  
  return (
    <div className="map-selector">
      <div className="map-container">
        <div ref={mapRef} style={{ height: '500px', width: '100%' }}></div>
      </div>
      
      {selectedBounds && (
        <div className="selection-info">
          <h3>Selected Area</h3>
          <p>
            <strong>North:</strong> {selectedBounds.north.toFixed(6)}°<br />
            <strong>South:</strong> {selectedBounds.south.toFixed(6)}°<br />
            <strong>East:</strong> {selectedBounds.east.toFixed(6)}°<br />
            <strong>West:</strong> {selectedBounds.west.toFixed(6)}°
          </p>
          <p>
            <strong>Area:</strong> {selectedArea ? `${selectedArea.toFixed(2)} km²` : 'Calculating...'}
          </p>
          
          {isAreaTooLarge && (
            <div className="error-message">
              <p>Selected area is too large! Maximum allowed area is {MAX_AREA_SQ_KM} km².</p>
              <p>Please select a smaller area to ensure optimal performance.</p>
            </div>
          )}
          
          <button 
            onClick={handleGenerateMap} 
            disabled={isAreaTooLarge || !selectedBounds}
            className={isAreaTooLarge ? 'disabled' : ''}
          >
            Generate Map
          </button>
        </div>
      )}
      
      {!selectedBounds && (
        <div className="instructions">
          <h3>Instructions:</h3>
          <p>Use the rectangle tool on the right side of the map to select an area.</p>
          <p>The selected area will be used to generate your terrain map.</p>
        </div>
      )}
    </div>
  );
};

export default MapSelector; 