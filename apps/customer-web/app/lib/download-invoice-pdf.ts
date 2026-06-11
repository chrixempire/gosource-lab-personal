import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { createApp, nextTick, type VNode } from 'vue';

void html2canvas;

type DownloadInvoicePdfOptions = {
  fileName: string;
  renderComponent: () => VNode;
  elementId: string;
};

/** Matches gosource-web-app `downloadInvoicePDF` (client-side jsPDF). */
export function downloadInvoicePDF({
  fileName,
  renderComponent,
  elementId,
}: DownloadInvoicePdfOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    const app = createApp({
      render: renderComponent,
    });

    app.mount(container);

    void nextTick().then(() => {
      const doc = new jsPDF();
      const invoiceElement = document.getElementById(elementId) as HTMLElement | null;

      if (!invoiceElement) {
        app.unmount();
        document.body.removeChild(container);
        reject(new Error('Invoice element not found'));
        return;
      }

      doc.html(invoiceElement, {
        callback(pdf) {
          try {
            pdf.save(fileName);
            resolve();
          } catch (error) {
            reject(error);
          } finally {
            app.unmount();
            document.body.removeChild(container);
          }
        },
        margin: 5,
        autoPaging: 'text',
        x: 5,
        y: 5,
        width: 180,
        windowWidth: 821,
      });
    });
  });
}
