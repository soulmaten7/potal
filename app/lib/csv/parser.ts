/**
 * F109: CSV Parser — Reusable CSV parsing with validation
 * No external dependencies (pure TypeScript).
 */

export interface CsvParseResult {
  rows: Record<string, string>[];
  errors: { row: number; message: string }[];
  totalRows: number;
  validRows: number;
  headers: string[];
}

export interface CsvParseOptions {
  maxRows?: number;
  requiredColumns?: string[];
  skipEmptyRows?: boolean;
  delimiter?: string;
}

const DEFAULT_MAX_ROWS = 10000;

/**
 * Parse CSV content string into structured rows.
 * Handles: BOM, quoted fields, escaped quotes, CRLF/LF, empty rows.
 */
export function parseCsv(content: string, options?: CsvParseOptions): CsvParseResult {
  const maxRows = options?.maxRows ?? DEFAULT_MAX_ROWS;
  const skipEmpty = options?.skipEmptyRows ?? true;
  const delimiter = options?.delimiter ?? ',';

  // Remove BOM (UTF-8/16)
  let text = content;
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

  const lines = text.split(/\r?\n/);
  if (lines.length < 1) return { rows: [], errors: [{ row: 0, message: 'Empty file' }], totalRows: 0, validRows: 0, headers: [] };

  // Parse header
  const headers = parseLine(lines[0], delimiter).map(h => h.trim().toLowerCase().replace(/^\"|\"$/g, ''));
  if (headers.length === 0 || headers.every(h => !h)) {
    return { rows: [], errors: [{ row: 1, message: 'No valid headers found' }], totalRows: 0, validRows: 0, headers: [] };
  }

  // Check required columns
  const errors: { row: number; message: string }[] = [];
  if (options?.requiredColumns) {
    const missing = options.requiredColumns.filter(c => !headers.includes(c.toLowerCase()));
    if (missing.length > 0) {
      errors.push({ row: 1, message: `Missing required columns: ${missing.join(', ')}. Found: ${headers.join(', ')}` });
      return { rows: [], errors, totalRows: 0, validRows: 0, headers };
    }
  }

  // Parse data rows
  const rows: Record<string, string>[] = [];
  let totalParsed = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (skipEmpty && !line.trim()) continue;

    totalParsed++;
    if (totalParsed > maxRows) {
      errors.push({ row: i + 1, message: `Exceeded maximum of ${maxRows} rows` });
      break;
    }

    const values = parseLine(line, delimiter);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = (values[j] || '').trim();
    }
    rows.push(row);
  }

  return {
    rows,
    errors,
    totalRows: totalParsed,
    validRows: rows.length,
    headers,
  };
}

/**
 * Parse a single CSV line handling quoted fields.
 */
function parseLine(line: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
