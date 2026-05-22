import * as ejs from 'ejs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';

export class PdfUtil {
  static async generatePdf(data: any, fileName: string): Promise<Buffer> {
    const rootDir = process.cwd();
    const filePath = path.join(
      rootDir,
      'src',
      'templates',
      'pdf',
      `${fileName}.ejs`,
    );
    const renderedContent = await ejs.renderFile(filePath, data);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(renderedContent, { waitUntil: 'load' });

    // await page.setContent(renderedContent, { waitUntil: 'domcontentloaded' });

    const pdfData = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '40px',
        right: '28px',
        bottom: '32px',
        left: '28px',
      },
    });

    await browser.close();

    return Buffer.from(pdfData);
  }
}
