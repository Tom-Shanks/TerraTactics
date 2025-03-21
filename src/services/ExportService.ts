import { jsPDF } from 'jspdf';
import { Bounds } from '../types';
import { ContourLine } from './ContourService';
import { GridCell } from './GridService';
import RenderService, { RenderOptions } from './RenderService';

interface ExportOptions {
  filename: string;
  format: 'pdf' | 'png';
  paperSize: 'a4' | 'letter' | 'a3' | 'tabloid' | 'custom';
  customWidth?: number; // in mm, for custom paper size
  customHeight?: number; // in mm, for custom paper size
  orientation: 'portrait' | 'landscape';
  dpi: number;
  includeMetadata: boolean; // Whether to include metadata (date, bounds, etc.)
  title?: string;
}

class ExportService {
  // Default export options
  defaultOptions: ExportOptions = {
    filename: 'terrain-map',
    format: 'pdf',
    paperSize: 'a4',
    orientation: 'landscape',
    dpi: 300,
    includeMetadata: true
  };

  /**
   * Export a map to a file
   * @param bounds The geographic bounds of the map
   * @param contours The contour lines
   * @param grid The grid cells
   * @param renderOptions Rendering options
   * @param exportOptions Export options
   * @returns The URL of the exported file
   */
  async exportMap(
    bounds: Bounds,
    contours: ContourLine[],
    grid: GridCell[],
    renderOptions: Partial<RenderOptions> = {},
    exportOptions: Partial<ExportOptions> = {}
  ): Promise<string> {
    // Merge options with defaults
    const options: ExportOptions = { 
      ...this.defaultOptions, 
      ...exportOptions,
      filename: exportOptions.filename || `terrain-map-${new Date().toISOString().split('T')[0]}`
    };
    
    if (options.format === 'pdf') {
      return this.exportToPDF(bounds, contours, grid, renderOptions, options);
    } else {
      return this.exportToPNG(bounds, contours, grid, renderOptions, options);
    }
  }

  /**
   * Export a map to a PNG file
   * @param bounds The geographic bounds of the map
   * @param contours The contour lines
   * @param grid The grid cells
   * @param renderOptions Rendering options
   * @param exportOptions Export options
   * @returns The URL of the exported PNG file
   */
  private async exportToPNG(
    bounds: Bounds,
    contours: ContourLine[],
    grid: GridCell[],
    renderOptions: Partial<RenderOptions>,
    exportOptions: ExportOptions
  ): Promise<string> {
    // Calculate dimensions based on paper size and orientation
    const { width, height } = this.calculateDimensions(exportOptions);
    
    // Create a canvas with the right dimensions
    const customRenderOptions: Partial<RenderOptions> = {
      ...renderOptions,
      width: Math.round(width / 25.4 * exportOptions.dpi), // Convert mm to pixels at specified DPI
      height: Math.round(height / 25.4 * exportOptions.dpi)
    };
    
    // Create a high-resolution canvas
    const canvas = RenderService.createHighResolutionCanvas(
      bounds, 
      contours, 
      grid, 
      customRenderOptions,
      exportOptions.dpi
    );
    
    // Get the PNG blob
    const blob = await RenderService.exportToPNG(canvas);
    
    // Create a download URL
    const url = URL.createObjectURL(blob);
    
    return url;
  }

  /**
   * Export a map to a PDF file
   * @param bounds The geographic bounds of the map
   * @param contours The contour lines
   * @param grid The grid cells
   * @param renderOptions Rendering options
   * @param exportOptions Export options
   * @returns The URL of the exported PDF file
   */
  private async exportToPDF(
    bounds: Bounds,
    contours: ContourLine[],
    grid: GridCell[],
    renderOptions: Partial<RenderOptions>,
    exportOptions: ExportOptions
  ): Promise<string> {
    // Calculate dimensions based on paper size and orientation
    const { width, height } = this.calculateDimensions(exportOptions);
    
    // Create PDF with the right dimensions (jsPDF uses points, 1 point = 0.352778 mm)
    const orientation = exportOptions.orientation === 'landscape' ? 'l' : 'p';
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: exportOptions.paperSize === 'custom' 
        ? [exportOptions.customWidth || 210, exportOptions.customHeight || 297]
        : exportOptions.paperSize
    });
    
    // Calculate the drawable area (subtracting margins)
    const margin = 10; // 10mm margin
    const drawableWidth = width - 2 * margin;
    const drawableHeight = height - 2 * margin;
    
    // Add title if provided
    if (exportOptions.title) {
      pdf.setFontSize(16);
      pdf.text(exportOptions.title, width / 2, margin, { align: 'center' });
    }
    
    // Add metadata if requested
    if (exportOptions.includeMetadata) {
      this.addMetadata(pdf, bounds, exportOptions, width, height);
    }
    
    // Set up render options for the map (scaled to fit the drawable area)
    const customRenderOptions: Partial<RenderOptions> = {
      ...renderOptions,
      width: Math.round(drawableWidth / 25.4 * 72), // Convert mm to points (jsPDF works at 72 DPI)
      height: Math.round(drawableHeight / 25.4 * 72)
    };
    
    // Create a canvas with the map
    const canvas = RenderService.createHighResolutionCanvas(
      bounds, 
      contours, 
      grid, 
      customRenderOptions,
      72 // jsPDF works at 72 DPI
    );
    
    // Get the canvas as data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    
    // Add the map to the PDF
    pdf.addImage(
      dataUrl, 
      'JPEG', 
      margin, 
      margin + (exportOptions.title ? 10 : 0), 
      drawableWidth, 
      drawableHeight
    );
    
    // Convert the PDF to a blob
    const blob = pdf.output('blob');
    
    // Create a download URL
    const url = URL.createObjectURL(blob);
    
    return url;
  }

  /**
   * Add metadata to the PDF
   * @param pdf The PDF document
   * @param bounds The geographic bounds
   * @param options Export options
   * @param width PDF width in mm
   * @param height PDF height in mm
   */
  private addMetadata(
    pdf: jsPDF,
    bounds: Bounds,
    options: ExportOptions,
    width: number,
    height: number
  ): void {
    const { north, south, east, west } = bounds;
    const dateStr = new Date().toLocaleDateString();
    
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    
    // Add date at bottom left
    pdf.text(`Generated: ${dateStr}`, 10, height - 5);
    
    // Add bounds at bottom right
    const boundsText = `Bounds: N${north.toFixed(6)}° S${south.toFixed(6)}° E${east.toFixed(6)}° W${west.toFixed(6)}°`;
    pdf.text(boundsText, width - 10, height - 5, { align: 'right' });
    
    // Add document properties
    pdf.setProperties({
      title: options.title || 'Terrain Map',
      subject: `Map of area bounded by N${north.toFixed(4)}° S${south.toFixed(4)}° E${east.toFixed(4)}° W${west.toFixed(4)}°`,
      creator: 'Terrain Map Generator',
      author: 'Terrain Map Generator',
      keywords: 'terrain, map, contour, tabletop, gaming'
    });
  }

  /**
   * Calculate PDF dimensions based on paper size and orientation
   * @param options Export options
   * @returns Width and height in mm
   */
  private calculateDimensions(options: ExportOptions): { width: number, height: number } {
    let width: number;
    let height: number;
    
    // Set dimensions based on paper size
    switch (options.paperSize) {
      case 'a4':
        width = 210;
        height = 297;
        break;
      case 'letter':
        width = 215.9;
        height = 279.4;
        break;
      case 'a3':
        width = 297;
        height = 420;
        break;
      case 'tabloid':
        width = 279.4;
        height = 431.8;
        break;
      case 'custom':
        width = options.customWidth || 210;
        height = options.customHeight || 297;
        break;
      default:
        width = 210;
        height = 297;
    }
    
    // Swap width/height for landscape orientation
    if (options.orientation === 'landscape' && width < height) {
      [width, height] = [height, width];
    }
    
    return { width, height };
  }

  /**
   * Create a download link for a file URL
   * @param url The URL of the file
   * @param filename The filename
   * @returns An anchor element that triggers the download
   */
  createDownloadLink(url: string, filename: string): HTMLAnchorElement {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.textContent = 'Download Map';
    link.style.display = 'inline-block';
    link.style.padding = '10px 15px';
    link.style.backgroundColor = '#4caf50';
    link.style.color = 'white';
    link.style.textDecoration = 'none';
    link.style.borderRadius = '4px';
    link.style.cursor = 'pointer';
    link.style.fontSize = '16px';
    
    return link;
  }
}

export default new ExportService();
export type { ExportOptions }; 