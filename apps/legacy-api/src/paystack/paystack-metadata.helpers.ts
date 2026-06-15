/** Read creditAccountId from Paystack verify/webhook metadata shapes. */
export function resolvePaystackCreditAccountId(
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  const direct = metadata.creditAccountId ?? metadata.credit_account_id;
  if (direct != null && String(direct).trim()) {
    return String(direct).trim();
  }

  const customFields = metadata.custom_fields;
  if (!Array.isArray(customFields)) {
    return null;
  }

  for (const field of customFields) {
    if (!field || typeof field !== 'object') {
      continue;
    }

    const record = field as Record<string, unknown>;
    const variableName = String(record.variable_name ?? record.display_name ?? '');
    if (variableName !== 'creditAccountId') {
      continue;
    }

    const value = record.value;
    if (value != null && String(value).trim()) {
      return String(value).trim();
    }
  }

  return null;
}
