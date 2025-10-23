import { exportToExcel } from './lazyExcelUtils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export type ChartDataRow = Record<string, string | number | boolean | Date>;

export interface ChartExportOptions {
  filename?: string;
  format: 'png' | 'jpg' | 'svg' | 'pdf' | 'excel' | 'csv';
  quality?: number; // 0.1 to 1.0 for jpg
  backgroundColor?: string;
  width?: number;
  height?: number;
  pixelRatio?: number;
}

export interface PDFExportOptions {
  orientation?: 'portrait' | 'landscape';
  unit?: 'pt' | 'mm' | 'cm' | 'in';
  format?: 'a4' | 'a3' | 'letter' | [number, number];
  title?: string;
  description?: string;
  includeTimestamp?: boolean;
}

export class ChartExportService {
  private static instance: ChartExportService;

  static getInstance(): ChartExportService {
    if (!ChartExportService.instance) {
      ChartExportService.instance = new ChartExportService();
    }
    return ChartExportService.instance;
  }

  /**
   * Export chart element as image using canvas
   */
  async exportAsImage(element: HTMLElement, options: ChartExportOptions): Promise<void> {
    const { filename = 'chart', format, backgroundColor = '#ffffff' } = options;

    try {
      // Create canvas from element
      const canvas = await this.elementToCanvas(element, backgroundColor);
      let dataUrl: string;

      switch (format) {
        case 'png':
          dataUrl = canvas.toDataURL('image/png');
          break;
        case 'jpg':
          dataUrl = canvas.toDataURL('image/jpeg', options.quality || 0.8);
          break;
        case 'svg':
          // SVG export would require different approach
          throw new Error('SVG export requires additional libraries');
        default:
          throw new Error(`Unsupported image format: ${format}`);
      }

      // Download the image
      this.downloadDataUrl(dataUrl, `${filename}.${format}`);
    } catch (error) {
      throw new Error(
        `Image export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Export chart as PDF
   */
  async exportAsPDF(
    element: HTMLElement,
    chartOptions: ChartExportOptions,
    pdfOptions: PDFExportOptions = {}
  ): Promise<void> {
    const {
      orientation = 'landscape',
      unit = 'mm',
      format = 'a4',
      title,
      description,
      includeTimestamp = true,
    } = pdfOptions;

    const { filename = 'chart' } = chartOptions;

    try {
      // Create PDF document
      const pdf = new jsPDF({
        orientation,
        unit,
        format,
      });

      // Get page dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;

      // Add title if provided
      let yPosition = margin;
      if (title) {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, margin, yPosition);
        yPosition += 10;
      }

      // Add description if provided
      if (description) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        const splitDescription = pdf.splitTextToSize(description, pageWidth - 2 * margin);
        pdf.text(splitDescription, margin, yPosition);
        yPosition += splitDescription.length * 5 + 5;
      }

      // Add timestamp if requested
      if (includeTimestamp) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPosition);
        yPosition += 10;
      }

      // Convert chart to image
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      const chartImageDataUrl = canvas.toDataURL('image/png');

      // Calculate image dimensions to fit page
      const maxWidth = pageWidth - 2 * margin;
      const maxHeight = pageHeight - yPosition - margin;

      // Add image to PDF
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        let imgWidth = maxWidth;
        let imgHeight = imgWidth / aspectRatio;

        if (imgHeight > maxHeight) {
          imgHeight = maxHeight;
          imgWidth = imgHeight * aspectRatio;
        }

        const xPosition = (pageWidth - imgWidth) / 2;

        pdf.addImage(chartImageDataUrl, 'PNG', xPosition, yPosition, imgWidth, imgHeight);

        // Save PDF
        pdf.save(`${filename}.pdf`);
      };
      img.src = chartImageDataUrl;
    } catch (error) {
      throw new Error(
        `PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Export chart data as Excel
   */
  async exportAsExcel(data: any[], headers: string[], options: ChartExportOptions): Promise<void> {
    const { filename = 'chart-data' } = options;

    try {
      await exportToExcel(data, headers, {
        filename,
        sheetName: 'Chart Data',
      });
    } catch (error) {
      throw new Error(
        `Excel export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Export chart data as CSV
   */
  async exportAsCSV(data: any[], headers: string[], options: ChartExportOptions): Promise<void> {
    const { filename = 'chart-data' } = options;

    try {
      const csvContent = this.generateCSVContent(data, headers);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      this.downloadBlob(blob, `${filename}.csv`);
    } catch (error) {
      throw new Error(
        `CSV export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Batch export in multiple formats
   */
  async exportMultipleFormats(
    element: HTMLElement,
    data: any[],
    headers: string[],
    formats: ChartExportOptions['format'][],
    baseOptions: Omit<ChartExportOptions, 'format'>
  ): Promise<void> {
    const promises = formats.map((format) => {
      const options = { ...baseOptions, format };

      switch (format) {
        case 'png':
        case 'jpg':
        case 'svg':
          return this.exportAsImage(element, options);
        case 'pdf':
          return this.exportAsPDF(element, options);
        case 'excel':
          return this.exportAsExcel(data, headers, options);
        case 'csv':
          return this.exportAsCSV(data, headers, options);
        default:
          return Promise.reject(new Error(`Unsupported format: ${format}`));
      }
    });

    try {
      await Promise.all(promises);
    } catch (error) {
      throw new Error(
        `Batch export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate CSV content from data
   */
  private generateCSVContent(data: any[], headers: string[]): string {
    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? '';
          })
          .join(',')
      ),
    ];
    return csvRows.join('\n');
  }

  /**
   * Download data URL as file
   */
  private downloadDataUrl(dataUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Download blob as file
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  private async elementToCanvas(
    element: HTMLElement,
    backgroundColor: string
  ): Promise<HTMLCanvasElement> {
    return html2canvas(element, {
      backgroundColor,
      scale: 2, // Higher resolution
      useCORS: true,
      allowTaint: false,
    });
  }
}

// Export singleton instance
export const chartExportService = ChartExportService.getInstance();


