export type ChartDataRow = Record<string, string | number | boolean | Date>;

export interface ChartExportOptions {
  filename?: string;
  format: 'csv' | 'excel' | 'json';
}

/**
 * Simplified chart export service focusing on data export
 * Image and PDF export would require additional dependencies
 */
export class ChartExportService {
  private static instance: ChartExportService;

  static getInstance(): ChartExportService {
    if (!ChartExportService.instance) {
      ChartExportService.instance = new ChartExportService();
    }
    return ChartExportService.instance;
  }

  /**
   * Export chart data as CSV
   */
  async exportAsCSV(
    data: ChartDataRow[],
    headers: string[],
    options: ChartExportOptions
  ): Promise<void> {
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
   * Export chart data as JSON
   */
  async exportAsJSON(data: ChartDataRow[], options: ChartExportOptions): Promise<void> {
    const { filename = 'chart-data' } = options;

    try {
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      this.downloadBlob(blob, `${filename}.json`);
    } catch (error) {
      throw new Error(
        `JSON export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Export chart data as Excel (using existing utility)
   */
  async exportAsExcel(
    data: ChartDataRow[],
    headers: string[],
    options: ChartExportOptions
  ): Promise<void> {
    const { filename = 'chart-data' } = options;

    try {
      const { exportToExcel } = await import('./lazyExcelUtils');
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
   * Batch export in multiple formats
   */
  async exportMultipleFormats(
    data: ChartDataRow[],
    headers: string[],
    formats: ChartExportOptions['format'][],
    baseOptions: Omit<ChartExportOptions, 'format'>
  ): Promise<void> {
    const promises = formats.map((format) => {
      const options = { ...baseOptions, format };

      switch (format) {
        case 'csv':
          return this.exportAsCSV(data, headers, options);
        case 'excel':
          return this.exportAsExcel(data, headers, options);
        case 'json':
          return this.exportAsJSON(data, options);
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
  private generateCSVContent(data: ChartDataRow[], headers: string[]): string {
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
}

// Export singleton instance
export const chartExportService = ChartExportService.getInstance();
