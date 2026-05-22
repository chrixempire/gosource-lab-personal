import type { PurchaseOrderInvoicePreview } from './purchase-order-invoice-data';

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
}

export async function generatePurchaseOrderInvoicePdf(
  preview: PurchaseOrderInvoicePreview,
): Promise<ArrayBuffer> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = margin;

  const ensureSpace = (height: number) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y + height > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFillColor(9, 66, 12);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('GoSource', margin, 18);
  doc.setFontSize(12);
  doc.text(preview.referenceLabel, pageWidth - margin, 18, { align: 'right' });

  y = 38;
  doc.setTextColor(102, 112, 133);
  doc.setFontSize(10);
  doc.text('Expected date', margin, y);
  doc.text('Ordered by', pageWidth / 2, y);
  y += 6;
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(preview.expectedDateLabel, margin, y);
  doc.text(preview.orderedByLabel, pageWidth / 2, y);

  y += 12;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(102, 112, 133);
  doc.text('Bill to', margin, y);
  y += 6;
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(10);

  if (preview.billTo.length === 0) {
    doc.text('—', margin, y);
    y += 6;
  } else {
    for (const person of preview.billTo) {
      ensureSpace(10);
      doc.setFont('helvetica', 'bold');
      doc.text(person.name, margin, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.text(person.email, margin, y);
      y += 7;
    }
  }

  y += 4;
  ensureSpace(12);
  doc.setFillColor(235, 249, 237);
  doc.rect(margin, y - 5, pageWidth - margin * 2, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(52, 64, 84);
  doc.text('No.', margin + 1, y);
  doc.text('Item', margin + 12, y);
  doc.text('Qty', pageWidth - margin - 48, y, { align: 'right' });
  doc.text('Rate', pageWidth - margin - 32, y, { align: 'right' });
  doc.text('Price', pageWidth - margin - 2, y, { align: 'right' });
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 84, 103);

  preview.lineItems.forEach((item, index) => {
    ensureSpace(8);
    doc.text(`${index + 1}.`, margin + 1, y);
    doc.text(item.name, margin + 12, y, { maxWidth: pageWidth - margin * 2 - 70 });
    doc.text(String(item.quantity), pageWidth - margin - 48, y, { align: 'right' });
    doc.text(formatNaira(item.unitPrice), pageWidth - margin - 32, y, { align: 'right' });
    doc.setTextColor(17, 24, 39);
    doc.text(formatNaira(item.totalPrice), pageWidth - margin - 2, y, { align: 'right' });
    doc.setTextColor(71, 84, 103);
    y += 7;
  });

  y += 4;
  ensureSpace(28);
  doc.setFillColor(242, 244, 247);
  const totalsHeight = preview.note ? 34 : 28;
  doc.rect(margin, y, pageWidth - margin * 2, totalsHeight, 'F');

  const totalRow = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 11 : 9);
    doc.setTextColor(bold ? 17 : 102, bold ? 24 : 112, bold ? 39 : 133);
    doc.text(label, margin + 4, y);
    doc.setTextColor(17, 24, 39);
    doc.text(value, pageWidth - margin - 4, y, { align: 'right' });
    y += bold ? 8 : 6;
  };

  y += 6;
  totalRow('Subtotal', formatNaira(preview.subtotal));
  totalRow('Logistics Amount', formatNaira(preview.logisticsAmount));
  totalRow('Total', formatNaira(preview.total), true);

  if (preview.note) {
    y += 4;
    ensureSpace(14);
    doc.setTextColor(102, 112, 133);
    doc.setFontSize(9);
    doc.text('Notes', margin, y);
    y += 5;
    doc.setTextColor(17, 24, 39);
    doc.setFont('helvetica', 'bold');
    const noteLines = doc.splitTextToSize(preview.note, pageWidth - margin * 2);
    doc.text(noteLines, margin, y);
  }

  return doc.output('arraybuffer');
}
