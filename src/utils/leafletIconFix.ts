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
    /* Fix Leaflet Draw toolbar icons */
    .leaflet-draw-toolbar a {
      background-image: url('https://unpkg.com/leaflet-draw@1.0.4/dist/images/spritesheet.svg') !important;
      background-repeat: no-repeat !important;
      background-size: 270px 30px !important;
    }
    
    .leaflet-draw-toolbar .leaflet-draw-draw-rectangle {
      background-position: -2px -2px !important;
    }
    
    .leaflet-draw-toolbar .leaflet-draw-edit-edit {
      background-position: -31px -2px !important;
    }
    
    .leaflet-draw-toolbar .leaflet-draw-edit-remove {
      background-position: -60px -2px !important;
    }
    
    /* Ensure map controls are visible */
    .leaflet-control-container,
    .leaflet-draw.leaflet-control,
    .leaflet-draw-toolbar,
    .leaflet-draw-actions,
    .leaflet-draw-toolbar a {
      display: block !important;
      visibility: visible !important;
      z-index: 1000 !important;
    }
  `;
  document.head.appendChild(leafletStyles);
} 