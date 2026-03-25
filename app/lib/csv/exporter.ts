/**
 * F109: CSV Exporter — Generate CSV with Excel compatibility
 * UTF-8 BOM for proper Korean/Japanese/Chinese character display.
 */

export interface CsvColumn {
  key: string;
  header: string;
}

export interface CsvExportOptions {
  columns: CsvColumn[];
  data: Record<string, unknown>[];
  delimiter?: string;
  includeHeaders?: boolean;
  addBom?: boolean;
}

const BOM = '\uFEFF';

/**
 * Generate CSV string from structured data.
 * - Adds UTF-8 BOM for Excel compatibility
 * - Escapes commas, quotes, newlines in cell values
 * - Uses CRLF line endings (Windows/Excel standard)
 */
export function generateCsv(options: CsvExportOptions): string {
  const { columns, data, delimiter = ',', includeHeaders = true, addBom = true } = options;

  const lines: string[] = [];

  if (includeHeaders) {
    lines.push(columns.map(c => escapeCell(c.header, delimiter)).join(delimiter));
  }

  for (const row of data) {
    const cells = columns.map(c => {
      const val = row[c.key];
      if (val === null || val === undefined) return '';
      return escapeCell(String(val), delimiter);
    });
    lines.push(cells.join(delimiter));
  }

  const csv = lines.join('\r\n') + '\r\n';
  return addBom ? BOM + csv : csv;
}

/**
 * Escape a cell value for CSV.
 * Wraps in quotes if contains delimiter, quote, or newline.
 */
function escapeCell(value: string, delimiter: string): string {
  if (value.includes(delimiter) || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}
