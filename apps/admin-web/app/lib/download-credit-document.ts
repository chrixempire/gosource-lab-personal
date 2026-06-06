import { creditDocumentDownloadPath } from '~/lib/credit-api';
import { creditDocumentFilename } from '~/lib/credit-document';

function filenameFromContentDisposition(header: string | null) {
  if (!header) {
    return null;
  }

  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const match = header.match(/filename="([^"]+)"/i) ?? header.match(/filename=([^;]+)/i);
  return match?.[1]?.trim() ?? null;
}

export async function downloadCreditDocument(resolvedUrl: string, filenameHint?: string) {
  const response = await fetch(creditDocumentDownloadPath(resolvedUrl), {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Unable to download document');
  }

  const blob = await response.blob();
  const filename =
    filenameFromContentDisposition(response.headers.get('Content-Disposition'))
    ?? filenameHint
    ?? creditDocumentFilename(resolvedUrl);

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}
