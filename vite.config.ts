import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'leaflet-vendor': ['leaflet', 'leaflet-draw'],
          'react-vendor': ['react', 'react-dom'],
          'geospatial': [
            './src/services/ElevationService.ts',
            './src/services/ContourService.ts',
            './src/services/GridService.ts',
            './src/services/ExportService.ts'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000 // Increase the warning limit to 1000kb
  },
  server: {
    host: true
  }
})
