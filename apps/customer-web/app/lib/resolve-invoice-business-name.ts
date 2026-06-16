import type { CustomerMeResponse } from '@gosource/api-client';
import { isBusinessOwnerSession } from '~/lib/customer-roles';

function resolveSessionBusinessName(session: CustomerMeResponse | null | undefined) {
  const data = session?.data;
  if (!data || typeof data !== 'object') {
    return '';
  }

  if ('businessName' in data && typeof data.businessName === 'string') {
    return data.businessName.trim();
  }

  const firstName = 'firstName' in data ? String(data.firstName ?? '').trim() : '';
  const lastName = 'lastName' in data ? String(data.lastName ?? '').trim() : '';
  return [firstName, lastName].filter(Boolean).join(' ');
}

export async function resolveInvoiceBusinessName(
  session: CustomerMeResponse | null | undefined,
  getBusinessAccount: () => Promise<{ businessName?: string | null } | null>,
) {
  const fromSession = resolveSessionBusinessName(session);
  if (fromSession) {
    return fromSession;
  }

  if (isBusinessOwnerSession(session)) {
    const account = await getBusinessAccount().catch(() => null);
    const businessName = account?.businessName?.trim();
    if (businessName) {
      return businessName;
    }
  }

  return '';
}
