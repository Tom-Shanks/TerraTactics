/**
 * This file ensures proper initialization of Leaflet Draw plugin
 */
import L from 'leaflet';
import 'leaflet-draw';

console.log("Leaflet Draw Setup - Starting initialization");

// Only run this in the browser
if (typeof window !== 'undefined') {
  console.log("Leaflet Draw Setup - Browser environment detected");
  
  // Make Leaflet available globally
  (window as any).L = L;
  console.log("Leaflet Draw Setup - Made L globally available");
  
  // Check current state
  console.log("Leaflet Draw Setup - Initial state check:");
  console.log("- L.version:", L.version);
  console.log("- L.Control exists:", !!L.Control);
  console.log("- L.Draw exists:", !!(L as any).Draw);
  console.log("- L.drawVersion exists:", !!(L as any).drawVersion);
  
  // Make sure L.drawVersion exists which is needed by some parts of leaflet-draw
  if (!(L as any).drawVersion) {
    console.log("Leaflet Draw Setup - Setting drawVersion");
    (L as any).drawVersion = "1.0.4";
  }
  
  // Ensure Draw namespace is properly setup on L
  if (!(L as any).Draw) {
    console.log("Leaflet Draw Setup - Creating Draw namespace");
    (L as any).Draw = {} as any;
  }
  
  // Make sure event types exist
  if (!(L as any).Draw.Event) {
    console.log("Leaflet Draw Setup - Creating Draw.Event namespace");
    (L as any).Draw.Event = {
      CREATED: 'draw:created',
      EDITED: 'draw:edited',
      DELETED: 'draw:deleted',
      DRAWSTART: 'draw:drawstart',
      DRAWSTOP: 'draw:drawstop',
      DRAWVERTEX: 'draw:drawvertex',
      EDITSTART: 'draw:editstart',
      EDITMOVE: 'draw:editmove',
      EDITRESIZE: 'draw:editresize',
      EDITVERTEX: 'draw:editvertex',
      EDITSTOP: 'draw:editstop',
      DELETESTART: 'draw:deletestart',
      DELETESTOP: 'draw:deletestop',
      // Add missing properties to match the Event type
      MARKERCONTEXT: 'draw:markercontext',
      TOOLBARCLOSED: 'draw:toolbarclosed',
      TOOLBAROPENED: 'draw:toolbaropened'
    };
  }
  
  // Check whether Control.Draw exists after our setup
  console.log("Leaflet Draw Setup - Final state check:");
  console.log("- L.Control.Draw exists:", !!(L.Control as any).Draw);
  
  // Try to manually add Draw to Control if it's still missing
  if (!(L.Control as any).Draw && (L as any).Draw) {
    console.log("Leaflet Draw Setup - Manually patching L.Control.Draw");
    try {
      (L.Control as any).Draw = (L as any).Draw.Control;
      console.log("- L.Control.Draw now exists:", !!(L.Control as any).Draw);
    } catch (e) {
      console.error("- Failed to patch L.Control.Draw:", e);
    }
  }
  
  // Create a direct shim if all else fails
  if (!(L.Control as any).Draw) {
    console.log("Leaflet Draw Setup - Creating direct shim for L.Control.Draw");
    try {
      // Define a basic constructor that will work for our specific use case
      (L.Control as any).Draw = function(options: any) {
        console.log("L.Control.Draw shim constructor called");
        
        // Create a basic control
        const control = L.control({position: options.position || 'topleft'}) as any;
        
        // Store options
        control.options = options;
        
        // Add custom onAdd method to create the control UI
        control.onAdd = function(map: any) {
          console.log("L.Control.Draw shim onAdd called");
          
          // Create container
          const container = L.DomUtil.create('div', 'leaflet-draw leaflet-control');
          const drawRect = L.DomUtil.create('a', 'leaflet-draw-draw-rectangle', container);
          drawRect.href = '#';
          drawRect.title = 'Draw a rectangle';
          drawRect.innerHTML = '<span class="sr-only">Draw a rectangle</span>';
          
          // Add click handler for the rectangle tool
          L.DomEvent.on(drawRect, 'click', L.DomEvent.stop);
          L.DomEvent.on(drawRect, 'click', function() {
            console.log("Rectangle draw button clicked");
            
            // Create a basic rectangle draw handler
            const shape = new L.Rectangle(
              map.getBounds().pad(-0.25), 
              options.draw.rectangle.shapeOptions
            );
            map.addLayer(shape);
            
            // Fire the created event
            map.fire('draw:created', {
              layer: shape,
              layerType: 'rectangle'
            });
          });
          
          return container;
        };
        
        return control;
      };
      
      console.log("- L.Control.Draw shim created successfully");
    } catch (e) {
      console.error("- Failed to create L.Control.Draw shim:", e);
    }
  }
}

console.log("Leaflet Draw Setup - Initialization complete");

// Export the extended Leaflet
export default L; 