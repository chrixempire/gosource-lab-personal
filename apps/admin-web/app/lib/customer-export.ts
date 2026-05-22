import type { AdminCustomerListItem } from '~/types/customers';

function escapeCsvCell(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadCustomersCsv(
  customers: AdminCustomerListItem[],
  filename = 'customers.csv',
) {
  if (customers.length === 0) {
    return;
  }

  const rows = customers.map((customer) => ({
    Name: customer.displayName,
    Email: customer.email,
    Phone: customer.phoneNumber,
    'Account type': customer.accountTypeLabel,
    Status: customer.statusLabel,
    'Use credit': customer.useCredit ? 'Yes' : 'No',
    'Date joined': customer.createdAtLabel,
  }));

  const headers = Object.keys(rows[0]!);
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) =>
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
