import * as fs from 'fs';
import * as ejs from 'ejs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';
import type { Browser } from 'puppeteer';

const PUPPETEER_LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
] as const;

function resolvePdfTemplatePath(fileName: string): string {
  const file = `${fileName}.ejs`;
  const candidates = [
    path.join(process.cwd(), 'src', 'templates', 'pdf', file),
    path.join(process.cwd(), 'dist', 'templates', 'pdf', file),
    path.join(__dirname, '..', 'templates', 'pdf', file),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`PDF template not found: ${fileName}`);
}

function resolveChromiumExecutablePath(): string | undefined {
  const fromEnv =
    process.env.PUPPETEER_EXECUTABLE_PATH?.trim() ||
    process.env.CHROME_PATH?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  for (const candidate of ['/usr/bin/chromium-browser', '/usr/bin/chromium']) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

async function launchBrowser(): Promise<Browser> {
  return puppeteer.launch({
    headless: true,
    executablePath: resolveChromiumExecutablePath(),
    args: [...PUPPETEER_LAUNCH_ARGS],
  });
}

export class PdfUtil {
  static async generatePdf(data: unknown, fileName: string): Promise<Buffer> {
    const filePath = resolvePdfTemplatePath(fileName);
    const renderedContent = await ejs.renderFile(filePath, data);

    const browser = await launchBrowser();

    try {
      const page = await browser.newPage();
      await page.setContent(renderedContent, { waitUntil: 'load', timeout: 30_000 });

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

      return Buffer.from(pdfData);
    } finally {
      await browser.close();
    }
  }
}
