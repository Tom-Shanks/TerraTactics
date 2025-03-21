/**
 * This file ensures proper initialization of Leaflet Draw plugin
 */
import L from 'leaflet';
import 'leaflet-draw';

// Make Leaflet globally available for plugins
if (typeof window !== 'undefined') {
  (window as any).L = L;
}

// Fix for handling Draw control events
const originalDrawToolbar = (L.DrawToolbar as any);
if (originalDrawToolbar) {
  const drawToolbarInitHook = originalDrawToolbar.prototype.initialize;
  originalDrawToolbar.prototype.initialize = function(options: any) {
    return drawToolbarInitHook.call(this, options);
  };
}

export default L; 