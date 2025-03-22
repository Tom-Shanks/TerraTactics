import React from 'react'
import ReactDOM from 'react-dom/client'

// Import Leaflet CSS first
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'

// Then import our app
import App from './App'
import './index.css'

// Define global Leaflet interface for TypeScript
declare global {
  interface Window {
    L: any;
  }
}

// Wait for DOM to be fully loaded before initializing React
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded, initializing application');
  
  // Check if Leaflet is loaded
  if (!window.L) {
    console.error('ERROR: Leaflet library not loaded! The application requires Leaflet to function.');
    
    // Display error message in the root element
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; color: red; text-align: center;">
          <h2>Error: Leaflet library not loaded</h2>
          <p>The application requires Leaflet to function. Please check your internet connection and reload the page.</p>
        </div>
      `;
    }
    return;
  }
  
  // Log Leaflet version
  console.log(`Leaflet loaded - version: ${window.L.version}`);
  
  // Initialize React app
  const rootElement = document.getElementById('root');
  if (rootElement) {
    console.log('Mounting React application');
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('React application mounted successfully');
  } else {
    console.error('ERROR: Root element not found! Cannot mount React application.');
  }
});

// Log when script loads
console.log('main.tsx loaded');
