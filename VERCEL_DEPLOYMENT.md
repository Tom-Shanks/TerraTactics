# Vercel Deployment Guide

This document explains how the project is configured for successful deployment on Vercel.

## Key Components

### 1. TypeScript Configuration

- TypeScript errors are handled gracefully with `--emitOnError false` in the build command
- `noUnusedLocals` and `noUnusedParameters` flags are turned off to prevent build failures
- Interface definitions have been updated to include all required properties

### 2. Leaflet Icons Fix

Leaflet map icons don't appear in production environments due to path resolution issues. We fix this with multiple approaches:

- CDN URLs are used for all Leaflet and Leaflet Draw assets
- A utility function `fixLeafletIcons()` is applied when the map initializes
- Custom CSS ensures toolbar icons are visible
- Index.html includes a script that sets Leaflet icon paths at runtime

### 3. Vercel Configuration

The project includes several Vercel-specific configurations:

- `vercel.json` with optimized routes for static assets and Leaflet resources
- Custom build command that handles TypeScript errors
- Cache control headers for optimal performance
- Security headers for production deployments

### 4. CSS Visibility Fixes

Map controls are made visible with:

- Explicit z-index values
- !important flags on visibility properties
- Proper positioning of control containers

## Debugging Deployment Issues

If you encounter issues with the Vercel deployment:

1. Check the Vercel build logs for any TypeScript errors that weren't handled
2. Examine the browser console for 404 errors related to missing assets
3. Verify that the Leaflet icon paths are correctly set at runtime
4. Use browser DevTools to check the visibility and z-index of map controls

## Updating Deployments

To update the Vercel deployment:

1. Push changes to the `main` branch
2. Vercel will automatically build and deploy the changes
3. If the build fails, review the logs and fix any issues
4. For cache invalidation, consider adding a version query parameter to assets 