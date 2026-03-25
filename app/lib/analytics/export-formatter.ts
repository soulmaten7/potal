/**
 * Analytics export formatter — CSV/JSON output for all analytics endpoints.
 */

/**
 * Convert data array to CSV and return as Response, or null for JSON fallback.
 */
export function formatAsExport(
  data: Array<Record<string, unknown>>,
  format: string,
  filename: string,
): Response | null {
  if (format !== 'csv') return null;

  const csv = convertToCSV(data);
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
    },
  });
}

/**
 * Convert array of objects to CSV string with proper escaping.
 */
export function convertToCSV(data: Array<Record<string, unknown>>): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h];
      const str = val === null || val === undefined ? '' : String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}
