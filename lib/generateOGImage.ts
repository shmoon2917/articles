import { createHash } from 'crypto';
import fs from 'fs';
import { DOMAIN } from 'services/constants';
import { chromium } from 'playwright';

export async function generateOpenGraphImage(path: string) {
  if (process.env.NODE_ENV === 'development') return;

  const baseUrl = DOMAIN;
  const url = `${baseUrl}${path}`;
  const hash = createHash('md5').update(url).digest('hex');

  const ogImageDir = './public/assets/og';
  const imagePath = `${ogImageDir}/${hash}.png`;
  const publicPath = `${baseUrl}/assets/og/${hash}.png`;

  console.log(publicPath);

  try {
    fs.statSync(imagePath);
    return publicPath;
  } catch (error: any) {
    console.log(`generating og image for ${path}`);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.goto(url, { waitUntil: 'networkidle' });
  const buffer = await page.screenshot({ type: 'png' });
  await browser.close();

  console.log('????');

  fs.mkdirSync(ogImageDir, { recursive: true });
  fs.writeFileSync(imagePath, buffer);
  return publicPath;
}
