import { resolveCreditDocumentUrl } from '~/lib/credit-api';

export type CreditDocumentKind = 'pdf' | 'image' | 'document';

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']);
const PDF_EXTENSIONS = new Set(['pdf']);

function extensionFromPath(value: string) {
  const withoutQuery = value.split('?')[0]?.split('#')[0] ?? value;
  const segment = withoutQuery.split('/').pop() ?? withoutQuery;
  const dotIndex = segment.lastIndexOf('.');
  if (dotIndex <= 0) {
    return '';
  }
  return segment.slice(dotIndex + 1).toLowerCase();
}

export function extractCreditDocumentUrl(raw: unknown): string {
  if (typeof raw === 'string') {
    return raw.trim();
  }

  if (raw && typeof raw === 'object' && 'url' in raw) {
    return String((raw as { url?: unknown }).url ?? '').trim();
  }

  return '';
}

export function normalizeCreditDocumentUrl(raw: unknown, cdnBase?: string | null): string {
  const value = extractCreditDocumentUrl(raw);
  if (!value) {
    return '';
  }

  return resolveCreditDocumentUrl(value, cdnBase) ?? value;
}

export function inferCreditDocumentKind(url: string): CreditDocumentKind {
  const extension = extensionFromPath(url);

  if (PDF_EXTENSIONS.has(extension)) {
    return 'pdf';
  }

  if (IMAGE_EXTENSIONS.has(extension)) {
    return 'image';
  }

  return 'document';
}

export function creditDocumentTypeLabel(kind: CreditDocumentKind) {
  if (kind === 'pdf') {
    return 'PDF';
  }

  if (kind === 'image') {
    return 'Image';
  }

  return 'Document';
}

export function creditDocumentFilename(url: string) {
  try {
    const pathname = new URL(url).pathname;
    const name = pathname.split('/').pop();
    return name ? decodeURIComponent(name) : 'document';
  } catch {
    return 'document';
  }
}
