// Note: BatchProcessor was designed for Supabase but is not currently used in the application
// Since we're migrating to PocketBase, this class remains for potential future use but is not implemented

interface BatchOperation<T = Record<string, unknown>> {
  type: 'insert' | 'update' | 'delete';
  table: string;
  data: T;
  condition?: Record<string, unknown>; // For update/delete
}

interface BatchResult {
  success: boolean;
  results: Record<string, unknown>[];
  errors: string[];
}

class BatchProcessor {
  private operations: BatchOperation[] = [];
  private batchSize = 10; // Process in chunks to avoid overwhelming the database

  add(operation: BatchOperation): void {
    this.operations.push(operation);
  }

  addMultiple(operations: BatchOperation[]): void {
    this.operations.push(...operations);
  }

  clear(): void {
    this.operations = [];
  }

  async execute(): Promise<BatchResult> {
    if (this.operations.length === 0) {
      return { success: true, results: [], errors: [] };
    }

    const results: Record<string, unknown>[] = [];
    const errors: string[] = [];

    // Group operations by table and type for efficiency
    const groupedOps = this.groupOperations();

    for (const [table, opsByType] of Object.entries(groupedOps)) {
      for (const [type, ops] of Object.entries(opsByType)) {
        try {
          const batchResults = await this.executeBatch(table, type as BatchOperation['type'], ops);
          results.push(...batchResults);
        } catch (error) {
          errors.push(`Batch ${type} on ${table}: ${error}`);
        }
      }
    }

    this.clear();
    return {
      success: errors.length === 0,
      results,
      errors,
    };
  }

  private groupOperations(): Record<string, Record<string, BatchOperation[]>> {
    const grouped: Record<string, Record<string, BatchOperation[]>> = {};

    for (const op of this.operations) {
      if (!grouped[op.table]) {
        grouped[op.table] = {};
      }
      if (!grouped[op.table][op.type]) {
        grouped[op.table][op.type] = [];
      }
      grouped[op.table][op.type].push(op);
    }

    return grouped;
  }

  private async executeBatch(
    table: string,
    type: BatchOperation['type'],
    operations: BatchOperation[]
  ): Promise<Record<string, unknown>[]> {
    // Note: This method is not implemented for PocketBase
    // It was designed for Supabase batch operations but is not currently used
    console.warn(`executeBatch: ${type} operations on ${table} not implemented for PocketBase`);
    return [];
  }
}

// Debounce utility for real-time subscriptions
export class Debouncer {
  private timeoutId: NodeJS.Timeout | null = null;
  private delay: number;

  constructor(delayMs: number = 1000) {
    this.delay = delayMs;
  }

  debounce(callback: () => void): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(callback, this.delay);
  }

  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

// Compression utility for data transfer
export class DataCompressor {
  static compress(data: Record<string, unknown>): string {
    try {
      return btoa(JSON.stringify(data));
    } catch {
      return JSON.stringify(data);
    }
  }

  static decompress(compressed: string): Record<string, unknown> {
    try {
      return JSON.parse(atob(compressed));
    } catch {
      return JSON.parse(compressed);
    }
  }
}

export const batchProcessor = new BatchProcessor();
export const debouncer = new Debouncer(2000); // 2 second debounce for real-time updates

