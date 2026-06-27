/**
 * Shared helper for building rich activity-log entries with field-level
 * before -> after detail, modelled on the inventory product logs. Use across
 * modules (customers, orders, credit, coupons, …) so every "update" log records
 * exactly what changed in a consistent shape the UI can render uniformly.
 */

export type FieldChange = { old: unknown; new: unknown };
export type ChangeMap = Record<string, FieldChange>;

export type FieldSpec = {
  /** Property key on the before/after objects. */
  key: string;
  /** Human label used in the description and the changes map. */
  label: string;
  /** Optional value normaliser (e.g. trim, round) for fair comparison/display. */
  format?: (value: unknown) => unknown;
};

function normalize(value: unknown, format?: (value: unknown) => unknown) {
  const v = format ? format(value) : value;
  return v === undefined ? null : v;
}

/**
 * Compare two records over the given fields and return only the ones that
 * actually changed, as { label: { old, new } }.
 */
export function buildChanges(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
  fields: FieldSpec[],
): ChangeMap {
  const changes: ChangeMap = {};
  const a = before ?? {};
  const b = after ?? {};

  for (const { key, label, format } of fields) {
    const oldValue = normalize(a[key], format);
    const newValue = normalize(b[key], format);
    // Compare structurally so object/array fields don't always look "changed".
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[label] = { old: oldValue, new: newValue };
    }
  }

  return changes;
}

/** "Updated <name>: <changed labels>" — or a fallback when nothing changed. */
export function describeChanges(
  entity: string,
  name: string | undefined,
  changes: ChangeMap,
): string {
  const labels = Object.keys(changes);
  const subject = name ? `${entity} ${name}` : entity;
  return labels.length
    ? `Updated ${subject}: ${labels.join(', ')}`
    : `Updated ${subject}`;
}

/** Whether any of the changed fields look price-related (for the priceChange filter). */
export function hasPriceChange(changes: ChangeMap): boolean {
  return Object.keys(changes).some((label) => /price/i.test(label));
}
