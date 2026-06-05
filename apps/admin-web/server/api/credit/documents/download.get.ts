import { createError, getQuery, setHeader } from 'h3';
import {
  creditDocumentFilename,
  isAllowedCreditDocumentUrl,
  resolveCreditDocumentUrl,
} from '../../../utils/credit-document-url';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const rawUrl = String(getQuery(event).url ?? '').trim();
  const url = resolveCreditDocumentUrl(rawUrl, config.public.creditDocumentCdnBaseUrl);

  if (!url || !isAllowedCreditDocumentUrl(url)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid document url' });
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw createError({ statusCode: 502, statusMessage: 'Unable to fetch document' });
  }

  const filename = creditDocumentFilename(url);
  const contentType = response.headers.get('content-type') ?? 'application/octet-stream';
  const body = Buffer.from(await response.arrayBuffer());

  setHeader(event, 'Content-Type', contentType);
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`);

  return body;
});
