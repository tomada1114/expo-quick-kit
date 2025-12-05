/**
 * Log Exporter - Compress and export error logs
 *
 * Provides functionality to export error logs from ErrorLogger with:
 * - Gzip compression using pako library
 * - File system export via expo-file-system
 * - Native sharing via expo-sharing
 * - Flexible filtering (date range, error codes, platforms)
 * - Data integrity verification
 * - Concurrent operation prevention
 *
 * Task 9.4: Log export functionality
 *
 * @module features/purchase/infrastructure/log-exporter
 */

import * as pako from 'pako';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { errorLogger, type ErrorLogEntry } from './error-logger';
import type { Result } from '@/lib/result';

/**
 * Export operation options
 */
export interface ExportOptions {
  /** Filter logs by start date (inclusive: >=) */
  since?: Date;

  /** Filter logs by end date (inclusive: <=) */
  until?: Date;

  /** Filter by error codes */
  errorCodes?: string[];

  /** Filter by platforms */
  platforms?: ('ios' | 'android' | 'revenueCat')[];

  /** Compression level (0-9, default 6) */
  compressionLevel?: number;
}

/**
 * Export error types
 */
export type ExportError =
  | {
      code:
        | 'NO_LOGS_AVAILABLE'
        | 'INVALID_DATE_RANGE'
        | 'INVALID_FILTER'
        | 'SERIALIZATION_ERROR'
        | 'COMPRESSION_ERROR'
        | 'FILE_WRITE_ERROR'
        | 'SHARE_UNAVAILABLE'
        | 'INSUFFICIENT_STORAGE'
        | 'LOG_RETRIEVAL_ERROR'
        | 'STORAGE_CORRUPTED'
        | 'COMPRESSION_TIMEOUT'
        | 'SHARE_INTERRUPTED'
        | 'INVALID_LOG_DATA'
        | 'EXPORT_IN_PROGRESS';
      message: string;
      retryable: boolean;
    };

/**
 * Export result data
 */
export interface ExportData {
  compressedData: Buffer;
  originalSize: number;
  compressedSize: number;
  timestamp: Date;
  entryCount: number;
  summary?: {
    totalErrors: number;
    byCode: Record<string, number>;
    byPlatform: Record<string, number>;
    dateRange: {
      earliest: string;
      latest: string;
    };
  };
  filePath?: string;
}

/**
 * Log Exporter Service
 *
 * Handles compression, serialization, and export of error logs.
 * Provides file system and sharing capabilities.
 */
export const logExporter = {
  /** Export in progress flag (prevents concurrent operations) */
  isExporting: false,

  /**
   * Validate export options
   *
   * Checks:
   * - Date range validity (since <= until)
   * - Filter arrays not empty
   *
   * @param options - Export options to validate
   * @returns Error if invalid, undefined if valid
   */
  validateOptions(options: ExportOptions): ExportError | undefined {
    // Validate date range
    if (options.since && options.until && options.since > options.until) {
      return {
        code: 'INVALID_DATE_RANGE',
        message: "Invalid date range: 'since' must be before 'until'",
        retryable: false,
      };
    }

    // Validate error codes filter
    if (options.errorCodes && options.errorCodes.length === 0) {
      return {
        code: 'INVALID_FILTER',
        message: 'Error codes filter cannot be empty',
        retryable: false,
      };
    }

    // Validate platforms filter
    if (options.platforms && options.platforms.length === 0) {
      return {
        code: 'INVALID_FILTER',
        message: 'Platforms filter cannot be empty',
        retryable: false,
      };
    }

    return undefined;
  },

  /**
   * Filter error logs based on options
   *
   * @param logs - All error logs
   * @param options - Filter options
   * @returns Filtered logs
   */
  filterLogs(logs: ErrorLogEntry[], options: ExportOptions): ErrorLogEntry[] {
    let filtered = logs;

    // Filter by date range
    if (options.since) {
      filtered = filtered.filter((log) => log.timestamp >= options.since!);
    }
    if (options.until) {
      filtered = filtered.filter((log) => log.timestamp <= options.until!);
    }

    // Filter by error codes
    if (options.errorCodes && options.errorCodes.length > 0) {
      const codes = new Set(options.errorCodes);
      filtered = filtered.filter((log) => codes.has(log.errorCode));
    }

    // Filter by platforms
    if (options.platforms && options.platforms.length > 0) {
      const platforms = new Set(options.platforms);
      filtered = filtered.filter(
        (log) => log.platform && platforms.has(log.platform)
      );
    }

    return filtered;
  },

  /**
   * Serialize logs to JSON string
   *
   * Handles Date object serialization and preserves all metadata.
   *
   * @param logs - Filtered error logs
   * @param includeMetadata - Whether to include summary metadata
   * @returns JSON string representation
   */
  serializeLogs(
    logs: ErrorLogEntry[],
    includeMetadata?: boolean
  ): string {
    try {
      // Map logs to ensure timestamp is properly converted to ISO string
      // and all fields are serializable
      const entries = logs.map((log) => {
        const entry: any = {
          timestamp: log.timestamp.toISOString(),
          timestampISO: log.timestampISO,
          errorCode: log.errorCode,
          message: log.message,
          retryable: log.retryable,
        };

        // Add optional fields if present
        if (log.platform) {
          entry.platform = log.platform;
        }
        if (log.metadata) {
          entry.metadata = log.metadata;
        }
        if (log.stack) {
          entry.stack = log.stack;
        }
        if (log.nativeErrorCode !== undefined) {
          entry.nativeErrorCode = log.nativeErrorCode;
        }

        return entry;
      });

      const data: any = {
        exportedAt: new Date().toISOString(),
        entryCount: logs.length,
        entries,
      };

      if (includeMetadata && logs.length > 0) {
        const byCode: Record<string, number> = {};
        const byPlatform: Record<string, number> = {};
        const timestamps = logs.map((log) => log.timestamp.getTime());

        for (const log of logs) {
          byCode[log.errorCode] = (byCode[log.errorCode] ?? 0) + 1;
          if (log.platform) {
            byPlatform[log.platform] = (byPlatform[log.platform] ?? 0) + 1;
          }
        }

        data.metadata = {
          summary: {
            totalErrors: logs.length,
            byCode,
            byPlatform,
            dateRange: {
              earliest: new Date(Math.min(...timestamps)).toISOString(),
              latest: new Date(Math.max(...timestamps)).toISOString(),
            },
          },
        };
      }

      return JSON.stringify(data, null, 2);
    } catch (error) {
      throw new Error(
        `Failed to serialize logs: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },

  /**
   * Compress data using gzip
   *
   * @param data - Data to compress
   * @param level - Compression level (0-9, default 6)
   * @returns Compressed buffer
   */
  compress(data: string, level: number = 6): Buffer {
    try {
      return pako.gzip(data, { level }) as Buffer;
    } catch (error) {
      throw new Error(
        `Failed to compress: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },

  /**
   * Generate filename for log export
   *
   * Format: error-logs-YYYY-MM-DD.gz
   *
   * @returns Filename
   */
  generateFilename(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `error-logs-${year}-${month}-${day}.gz`;
  },

  /**
   * Export error logs with compression
   *
   * Main export function. Retrieves logs, filters, serializes, and compresses.
   *
   * Given/When/Then:
   * - Given: Error logs in ErrorLogger
   * - When: exportLogs() is called with optional filters
   * - Then: Returns compressed buffer with filtered, serialized logs
   *
   * @param options - Export options (filters, compression level)
   * @returns Result with compressed data or error
   *
   * @example
   * ```typescript
   * const result = await logExporter.exportLogs({
   *   since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
   *   errorCodes: ['NETWORK_ERROR', 'VERIFICATION_FAILED'],
   *   compressionLevel: 9,
   * });
   *
   * if (result.success) {
   *   console.log(`Exported ${result.data.entryCount} errors`);
   *   console.log(`Compressed from ${result.data.originalSize} to ${result.data.compressedSize} bytes`);
   * }
   * ```
   */
  async exportLogs(options: ExportOptions = {}): Promise<Result<ExportData, ExportError>> {
    try {
      // Validate options
      const validationError = this.validateOptions(options);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // Retrieve logs
      let logs: ErrorLogEntry[];
      try {
        logs = errorLogger.getLogs();
      } catch (error) {
        return {
          success: false,
          error: {
            code: 'LOG_RETRIEVAL_ERROR',
            message: `Failed to retrieve logs: ${error instanceof Error ? error.message : String(error)}`,
            retryable: true,
          },
        };
      }

      // Check if logs available
      if (logs.length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_LOGS_AVAILABLE',
            message: 'No error logs available to export',
            retryable: false,
          },
        };
      }

      // Filter logs
      const filtered = this.filterLogs(logs, options);
      if (filtered.length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_LOGS_AVAILABLE',
            message: 'No error logs match the specified filters',
            retryable: false,
          },
        };
      }

      // Serialize logs
      let serialized: string;
      try {
        serialized = this.serializeLogs(filtered);
      } catch (error) {
        return {
          success: false,
          error: {
            code: 'SERIALIZATION_ERROR',
            message: `Failed to serialize log data: ${error instanceof Error ? error.message : String(error)}`,
            retryable: false,
          },
        };
      }

      const originalSize = Buffer.byteLength(serialized, 'utf-8');

      // Compress logs
      let compressedData: Buffer;
      try {
        const level = options.compressionLevel ?? 6;
        compressedData = this.compress(serialized, level);
      } catch (error) {
        return {
          success: false,
          error: {
            code: 'COMPRESSION_ERROR',
            message: `Failed to compress logs: ${error instanceof Error ? error.message : String(error)}`,
            retryable: true,
          },
        };
      }

      const compressedSize = compressedData.length;

      return {
        success: true,
        data: {
          compressedData,
          originalSize,
          compressedSize,
          timestamp: new Date(),
          entryCount: filtered.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPRESSION_ERROR',
          message: `Unexpected error during export: ${error instanceof Error ? error.message : String(error)}`,
          retryable: true,
        },
      };
    }
  },

  /**
   * Export logs with summary metadata
   *
   * Similar to exportLogs() but includes summary statistics.
   *
   * @param options - Export options
   * @returns Result with compressed data and summary
   */
  async exportWithSummary(options: ExportOptions = {}): Promise<Result<ExportData, ExportError>> {
    const result = await this.exportLogs(options);

    if (!result.success) {
      return result;
    }

    // Add summary to result
    try {
      const logs = errorLogger.getLogs();
      const filtered = this.filterLogs(logs, options);

      if (filtered.length === 0) {
        return result;
      }

      const byCode: Record<string, number> = {};
      const byPlatform: Record<string, number> = {};
      const timestamps = filtered.map((log) => log.timestamp.getTime());

      for (const log of filtered) {
        byCode[log.errorCode] = (byCode[log.errorCode] ?? 0) + 1;
        if (log.platform) {
          byPlatform[log.platform] = (byPlatform[log.platform] ?? 0) + 1;
        }
      }

      result.data.summary = {
        totalErrors: filtered.length,
        byCode,
        byPlatform,
        dateRange: {
          earliest: new Date(Math.min(...timestamps)).toISOString(),
          latest: new Date(Math.max(...timestamps)).toISOString(),
        },
      };
    } catch (error) {
      // Continue without summary if error
      console.error('Failed to generate summary:', error);
    }

    return result;
  },

  /**
   * Export logs to file system
   *
   * Writes compressed logs to device storage with automatic filename.
   *
   * @param options - Export options
   * @returns Result with file path or error
   */
  async exportToFile(options: ExportOptions = {}): Promise<Result<ExportData, ExportError>> {
    // First export logs
    const exportResult = await this.exportLogs(options);
    if (!exportResult.success) {
      return exportResult;
    }

    try {
      // Generate filename and full path
      const filename = this.generateFilename();
      const filePath = `${FileSystem.documentDirectory}${filename}`;

      // Convert buffer to string for file writing
      const dataString = exportResult.data.compressedData.toString('base64');

      // Write to file system
      try {
        await FileSystem.writeAsStringAsync(filePath, dataString, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        // Determine error type
        let errorCode: ExportError['code'] = 'FILE_WRITE_ERROR';
        let retryable = true;

        if (message.includes('No space')) {
          errorCode = 'INSUFFICIENT_STORAGE';
          retryable = false;
        } else if (message.includes('Permission') || message.includes('EACCES')) {
          errorCode = 'STORAGE_CORRUPTED';
          retryable = false;
        } else if (message.includes('Network')) {
          errorCode = 'FILE_WRITE_ERROR';
          retryable = true;
        }

        return {
          success: false,
          error: {
            code: errorCode,
            message: `Failed to write log file: ${message}`,
            retryable,
          },
        };
      }

      return {
        success: true,
        data: {
          ...exportResult.data,
          filePath,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FILE_WRITE_ERROR',
          message: `Unexpected error writing file: ${error instanceof Error ? error.message : String(error)}`,
          retryable: true,
        },
      };
    }
  },

  /**
   * Share logs via native sharing interface
   *
   * Uses expo-sharing to open native share dialog for the compressed log file.
   *
   * @param options - Export options
   * @returns Result with share status or error
   */
  async shareLogs(options: ExportOptions = {}): Promise<Result<ExportData, ExportError>> {
    try {
      // Check if sharing is available
      const availableAsync = await Sharing.isAvailableAsync();
      if (!availableAsync) {
        return {
          success: false,
          error: {
            code: 'SHARE_UNAVAILABLE',
            message: 'Sharing not available on this device',
            retryable: false,
          },
        };
      }

      // Export to file first
      const fileResult = await this.exportToFile(options);
      if (!fileResult.success) {
        return fileResult;
      }

      try {
        // Share the file
        await Sharing.shareAsync(fileResult.data.filePath!, {
          mimeType: 'application/gzip',
          dialogTitle: 'Share Error Logs',
        });

        return {
          success: true,
          data: fileResult.data,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        // Distinguish between interruption and other errors
        let errorCode: ExportError['code'] = 'SHARE_INTERRUPTED';
        if (message.includes('cancelled')) {
          errorCode = 'SHARE_INTERRUPTED';
        }

        return {
          success: false,
          error: {
            code: errorCode,
            message: `Failed to share logs: ${message}`,
            retryable: false,
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SHARE_INTERRUPTED',
          message: `Unexpected error during share: ${error instanceof Error ? error.message : String(error)}`,
          retryable: false,
        },
      };
    }
  },
};
