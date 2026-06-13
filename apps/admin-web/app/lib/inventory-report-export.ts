import { buildInventoryReportCsvRows } from '~/lib/inventory-report-api';
import type { InventoryMovementRow } from '~/types/inventory-report';

function escapeCsvCell(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadInventoryReportCsv(
  rows: InventoryMovementRow[],
  filename = 'inventory-report.csv',
) {
  const dataRows = buildInventoryReportCsvRows(rows);
  if (dataRows.length === 0) {
    return;
  }

  const headers = Object.keys(dataRows[0]!);
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...dataRows.map((row) =>
      headers.map((header) => escapeCsvCell(String(row[header as keyof typeof row] ?? ''))).join(','),
    ),
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
