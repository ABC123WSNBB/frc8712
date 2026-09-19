const { chromium } = require('C:/Users/89227/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--enable-unsafe-swiftshader'] });
  try {
    for (const path of ['/', '/nebula.html']) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error' && !message.text().includes('favicon.ico')) errors.push(message.text()); });
      await page.route('**/favicon.ico', route => route.fulfill({ status: 204 }));
      await page.goto(`http://127.0.0.1:5173${path}`, { waitUntil: 'networkidle' });
      await page.locator('canvas').waitFor();
      await page.waitForTimeout(700);
      assert.equal(await page.locator('body').innerText(), '');
      assert.equal(await page.locator('canvas').count(), 1);
      assert.equal(await page.locator('input,dialog,header,aside,nav,form').count(), 0);
      assert.equal(await page.locator('.camera-toggle').count(), 1);
      assert.equal(await page.locator('.camera-preview.is-open').count(), 0);
      await page.locator('.camera-toggle').click();
      assert.equal(await page.locator('.camera-preview.is-open').count(), 1);
      await page.locator('.camera-toggle').click();
      assert.equal(await page.locator('.camera-preview.is-open').count(), 0);
      assert.deepEqual(await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth, document.documentElement.scrollHeight, document.documentElement.clientHeight]), [1440, 1440, 960, 960]);
      const before = await page.locator('canvas').screenshot();
      await page.mouse.move(700, 470); await page.mouse.down(); await page.mouse.move(830, 530, { steps: 8 }); await page.mouse.up(); await page.mouse.wheel(0, -180);
      await page.waitForTimeout(180);
      assert.equal(Buffer.compare(before, await page.locator('canvas').screenshot()) === 0, false);
      await page.setViewportSize({ width: 1100, height: 760 });
      assert.deepEqual(await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth, document.documentElement.scrollHeight, document.documentElement.clientHeight]), [1100, 1100, 760, 760]);
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('Browser acceptance passed: full-screen particle scene, optional camera preview, interaction, resize, and no page errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
