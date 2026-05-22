import { formatDashboardCurrency } from '~/lib/dashboard-date';
import { formatOrderDateTime } from '~/lib/order-details';
import type { AdminOrderListItem } from '~/types/orders';

function escapeCsvCell(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildOrdersCsvRows(orders: AdminOrderListItem[]) {
  return orders.map((order) => ({
    Reference: order.referenceLabel,
    Date: formatOrderDateTime(order.createdAt),
    Customer: order.customerName,
    Items: order.itemCountLabel,
    'Payment method': order.paymentMethodLabel,
    'Payment status': order.paymentStatusLabel,
    Status: order.statusLabel,
    Total: formatDashboardCurrency(order.totalPrice),
  }));
}

export function downloadOrdersCsv(orders: AdminOrderListItem[], filename = 'orders.csv') {
  const rows = buildOrdersCsvRows(orders);
  if (rows.length === 0) {
    return;
  }

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
