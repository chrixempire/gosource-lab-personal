import { createApp, nextTick, type Component } from 'vue';

/** Matches gosource-admin-v2 `OrderPreviewContent` root id. */
export const INVOICE_PREVIEW_ELEMENT_ID = 'preview-invoice';

const INVOICE_CAPTURE_WIDTH = 821;

type DownloadInvoicePdfOptions = {
  renderComponent: () => Component;
  elementId?: string;
};

function resolveImageSources(root: HTMLElement) {
  root.querySelectorAll('img').forEach((image) => {
    const src = image.getAttribute('src');
    if (src?.startsWith('/')) {
      image.src = `${window.location.origin}${src}`;
    }
  });
}

function prepareCloneForCapture(clonedDoc: Document, elementId: string) {
  const clonedRoot = clonedDoc.getElementById(elementId);
  if (!clonedRoot) {
    return;
  }

  clonedRoot.style.width = `${INVOICE_CAPTURE_WIDTH}px`;
  clonedRoot.style.maxWidth = `${INVOICE_CAPTURE_WIDTH}px`;
  clonedRoot.style.overflow = 'visible';
  clonedRoot.style.minHeight = 'auto';
  clonedRoot.style.height = 'auto';

  clonedRoot.querySelectorAll<HTMLElement>('*').forEach((node) => {
    node.style.overflow = 'visible';
  });
}

async function renderInvoiceElement(
  renderComponent: DownloadInvoicePdfOptions['renderComponent'],
  elementId: string,
) {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = `${INVOICE_CAPTURE_WIDTH}px`;
  container.style.background = '#ffffff';
  document.body.appendChild(container);

  const app = createApp({
    render: renderComponent,
  });

  app.mount(container);
  await nextTick();
  await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
  await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
  await new Promise((resolve) => setTimeout(resolve, 200));

  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts?.ready;
    } catch {
      // ignore font readiness failures
    }
  }

  const invoiceElement = container.querySelector(`#${elementId}`) as HTMLElement | null;

  if (!invoiceElement) {
    app.unmount();
    document.body.removeChild(container);
    throw new Error('Invoice preview element not found');
  }

  resolveImageSources(invoiceElement);

  const images = Array.from(invoiceElement.querySelectorAll('img'));
  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }
          image.addEventListener('load', () => resolve(), { once: true });
          image.addEventListener('error', () => resolve(), { once: true });
        }),
    ),
  );

  return {
    app,
    container,
    invoiceElement,
  };
}

function addCanvasToPdf(canvas: HTMLCanvasElement, doc: InstanceType<typeof import('jspdf').jsPDF>) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const printableWidth = pageWidth - margin * 2;
  const imgWidth = printableWidth;
  const imgHeight = (canvas.height * printableWidth) / canvas.width;
  const imgData = canvas.toDataURL('image/jpeg', 0.92);

  let heightLeft = imgHeight;
  let position = margin;

  doc.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
  heightLeft -= pageHeight - margin * 2;

  while (heightLeft > 0) {
    doc.addPage();
    position = margin - (imgHeight - heightLeft);
    doc.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;
  }
}

export async function generateInvoicePdfBlob({
  renderComponent,
  elementId = INVOICE_PREVIEW_ELEMENT_ID,
}: DownloadInvoicePdfOptions) {
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  const { app, container, invoiceElement } = await renderInvoiceElement(
    renderComponent,
    elementId,
  );

  try {
    const canvas = await html2canvas(invoiceElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: INVOICE_CAPTURE_WIDTH,
      windowWidth: INVOICE_CAPTURE_WIDTH,
      onclone: (clonedDoc) => prepareCloneForCapture(clonedDoc, elementId),
    });

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('Invoice preview rendered empty');
    }

    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    addCanvasToPdf(canvas, doc);

    return doc.output('blob');
  } finally {
    app.unmount();
    document.body.removeChild(container);
  }
}

export async function downloadInvoicePdf(
  fileName: string,
  options: DownloadInvoicePdfOptions,
) {
  const blob = await generateInvoicePdfBlob(options);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export async function shareInvoicePdf(
  fileName: string,
  options: DownloadInvoicePdfOptions,
) {
  const blob = await generateInvoicePdfBlob(options);
  const safeName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  const file = new File([blob], safeName, { type: 'application/pdf' });

  const sharePayload = {
    files: [file],
    title: safeName,
  };

  if (
    typeof navigator !== 'undefined' &&
    'share' in navigator &&
    'canShare' in navigator &&
    navigator.canShare?.(sharePayload)
  ) {
    await navigator.share(sharePayload);
    return;
  }

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = safeName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}
