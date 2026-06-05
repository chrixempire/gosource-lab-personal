const ALLOWED_DOCUMENT_HOST_SUFFIXES = [
  '.digitaloceanspaces.com',
  '.amazonaws.com',
  '.cloudinary.com',
];

function normalizeCreditDocumentPath(url: URL) {
  const parts = url.pathname.split('/').filter(Boolean);
  const bucketFromHost = url.hostname.split('.')[0];

  if (parts.length >= 2 && bucketFromHost && parts[0] === bucketFromHost) {
    url.pathname = `/${parts.slice(1).join('/')}`;
  }

  return url.toString();
}

export function resolveCreditDocumentUrl(
  raw: string | undefined | null,
  cdnBase?: string | null,
): string | null {
  let value = String(raw ?? '').trim();
  if (!value) {
    return null;
  }

  if (value.startsWith('//')) {
    value = `https:${value}`;
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      return normalizeCreditDocumentPath(new URL(value));
    } catch {
      return value;
    }
  }

  const base = String(cdnBase ?? process.env.NUXT_PUBLIC_CREDIT_DOCUMENT_CDN_BASE_URL ?? '')
    .trim()
    .replace(/\/$/, '');

  if (!base) {
    return null;
  }

  const key = value.replace(/^\//, '');
  return key ? `${base}/${key}` : null;
}

export function isAllowedCreditDocumentUrl(raw: string) {
  try {
    const { hostname, protocol } = new URL(raw);

    if (import.meta.dev) {
      return protocol === 'http:' || protocol === 'https:';
    }

    if (protocol !== 'https:') {
      return false;
    }

    return ALLOWED_DOCUMENT_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
  } catch {
    return false;
  }
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
