import L from 'leaflet';

// Fix Leaflet's default icon paths for production environments
export function fixLeafletIcons() {
  // Delete the default icon URL getter to override it
  delete (L.Icon.Default.prototype as any)._getIconUrl;

  // Set absolute URLs to fix production builds
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });

  // Add Leaflet Draw icon fixes
  const leafletStyles = document.createElement('style');
  leafletStyles.textContent = `
    .leaflet-draw-toolbar .leaflet-draw-draw-rectangle {
      background-image: url('https://unpkg.com/leaflet-draw@1.0.4/dist/images/spritesheet.svg');
      background-repeat: no-repeat;
      background-size: 270px 30px;
      background-position: -2px -2px;
    }
    
    .leaflet-draw-toolbar .leaflet-draw-edit-edit {
      background-image: url('https://unpkg.com/leaflet-draw@1.0.4/dist/images/spritesheet.svg');
      background-repeat: no-repeat;
      background-size: 270px 30px;
      background-position: -31px -2px;
    }
    
    .leaflet-draw-toolbar .leaflet-draw-edit-remove {
      background-image: url('https://unpkg.com/leaflet-draw@1.0.4/dist/images/spritesheet.svg');
      background-repeat: no-repeat;
      background-size: 270px 30px;
      background-position: -60px -2px;
    }
  `;
  document.head.appendChild(leafletStyles);
} 