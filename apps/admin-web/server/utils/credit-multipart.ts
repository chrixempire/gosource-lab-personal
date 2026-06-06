import type { H3Event } from 'h3';
import { readMultipartFormData } from 'h3';

export async function readCreditMultipartFormData(event: H3Event) {
  const parts = await readMultipartFormData(event);
  const formData = new FormData();

  for (const part of parts ?? []) {
    if (!part.name || part.data == null) {
      continue;
    }

    if (part.filename) {
      const blob = new Blob([new Uint8Array(part.data)], {
        type: part.type || 'application/octet-stream',
      });
      formData.append(part.name, blob, part.filename);
      continue;
    }

    formData.append(part.name, part.data.toString());
  }

  return formData;
}
