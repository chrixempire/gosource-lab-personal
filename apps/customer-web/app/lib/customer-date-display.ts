/** e.g. 25 May 2026, 11:20 AM — used on order and insight table date columns. */
export function formatCustomerTableDateTime(value: string | Date | null | undefined) {
  if (!value) {
    return '—';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const datePart = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);

  const timePart = new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(date)
    .replace(/\s*(am|pm)\s*$/i, (_, meridiem: string) => ` ${meridiem.toUpperCase()}`);

  return `${datePart}, ${timePart}`;
}
