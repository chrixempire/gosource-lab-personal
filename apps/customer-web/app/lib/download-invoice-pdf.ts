import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { createApp, nextTick, type VNode } from 'vue';

const INVOICE_CAPTURE_WIDTH = 821;
const PDF_MARGIN_MM = 10;

type DownloadInvoicePdfOptions = {
  fileName: string;
  renderComponent: () => VNode;
  elementId: string;
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

async function waitForInvoiceImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll('img'));

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
}

function addCanvasToPdf(canvas: HTMLCanvasElement, doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const printableWidth = pageWidth - PDF_MARGIN_MM * 2;
  const imgWidth = printableWidth;
  const imgHeight = (canvas.height * printableWidth) / canvas.width;
  const imgData = canvas.toDataURL('image/jpeg', 0.92);

  let heightLeft = imgHeight;
  let position = PDF_MARGIN_MM;

  doc.addImage(imgData, 'JPEG', PDF_MARGIN_MM, position, imgWidth, imgHeight);
  heightLeft -= pageHeight - PDF_MARGIN_MM * 2;

  while (heightLeft > 0) {
    doc.addPage();
    position = PDF_MARGIN_MM - (imgHeight - heightLeft);
    doc.addImage(imgData, 'JPEG', PDF_MARGIN_MM, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - PDF_MARGIN_MM * 2;
  }
}

/** Renders invoice HTML via html2canvas for faithful layout (symmetric margins). */
export function downloadInvoicePDF({
  fileName,
  renderComponent,
  elementId,
}: DownloadInvoicePdfOptions): Promise<void> {
  return new Promise((resolve, reject) => {
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

    void nextTick().then(async () => {
      await new Promise<void>((resolveFrame) => {
        requestAnimationFrame(() => resolveFrame());
      });
      await new Promise<void>((resolveFrame) => {
        requestAnimationFrame(() => resolveFrame());
      });

      const invoiceElement =
        (container.querySelector(`#${CSS.escape(elementId)}`) as HTMLElement | null) ??
        (document.getElementById(elementId) as HTMLElement | null);

      if (!invoiceElement) {
        app.unmount();
        document.body.removeChild(container);
        reject(new Error('Invoice element not found'));
        return;
      }

      resolveImageSources(invoiceElement);

      try {
        await waitForInvoiceImages(invoiceElement);

        if (typeof document !== 'undefined' && 'fonts' in document) {
          try {
            await (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts?.ready;
          } catch {
            // Continue if font loading fails.
          }
        }

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
        doc.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        app.unmount();
        document.body.removeChild(container);
      }
    });
  });
}
