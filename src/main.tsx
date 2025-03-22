import React from 'react'
import ReactDOM from 'react-dom/client'

// Import Leaflet CSS first
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'

// Then import our app
import App from './App.tsx'
import './index.css'

// Explicitly create the main app only after the DOM is fully loaded and Leaflet is available
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded, initializing application')
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  
  // Log the initialization to console
  console.log('React application initialized')
})
